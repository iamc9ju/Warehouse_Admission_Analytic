const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "outputs", "real_data");
const outputPath =
  process.env.GA4_OUTPUT_CSV ?? path.join(outputDir, "ga4_website_monthly.csv");
const rawPath =
  process.env.GA4_OUTPUT_RAW_JSON ?? path.join(outputDir, "ga4_website_raw.json");

const GA4_API_BASE_URL = "https://analyticsdata.googleapis.com/v1beta";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWT_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const ANALYTICS_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const REPORT_LIMIT = 10000;

const defaultAdmissionsWindows = [
  {
    academic_year: 2568,
    startDate: "2024-12-01",
    endDate: "2025-06-30",
  },
  {
    academic_year: 2569,
    startDate: "2025-12-01",
    endDate: "2026-06-30",
  },
];

function dateWindows() {
  if (!process.env.GA4_DATE_WINDOWS_JSON) {
    return defaultAdmissionsWindows;
  }

  const windows = JSON.parse(process.env.GA4_DATE_WINDOWS_JSON);
  if (!Array.isArray(windows) || windows.length === 0) {
    throw new Error("GA4_DATE_WINDOWS_JSON must be a non-empty JSON array");
  }

  for (const window of windows) {
    if (!window.academic_year || !window.startDate || !window.endDate) {
      throw new Error("Each GA4 date window requires academic_year, startDate and endDate");
    }
  }

  return windows;
}

const reportDimensions = [
  "yearMonth",
  "sessionPrimaryChannelGroup",
  "landingPage",
];

const reportMetrics = [
  "sessions",
  "activeUsers",
  "totalUsers",
  "newUsers",
  "screenPageViews",
  "engagedSessions",
  "engagementRate",
  "eventCount",
  "keyEvents",
  "userEngagementDuration",
];

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readServiceAccount() {
  const serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = process.env.GA4_SERVICE_ACCOUNT_FILE;

  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  if (serviceAccountFile) {
    return JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  }

  throw new Error("GA4_SERVICE_ACCOUNT_JSON or GA4_SERVICE_ACCOUNT_FILE is required");
}

function normalizePropertyId(value) {
  return value.startsWith("properties/") ? value : `properties/${value}`;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: serviceAccount.client_email,
    scope: ANALYTICS_READONLY_SCOPE,
    aud: serviceAccount.token_uri ?? GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(serviceAccount.private_key);

  return `${unsignedToken}.${base64Url(signature)}`;
}

async function getAccessToken(serviceAccount) {
  const tokenUrl = serviceAccount.token_uri ?? GOOGLE_TOKEN_URL;
  const params = new URLSearchParams({
    grant_type: GOOGLE_JWT_GRANT_TYPE,
    assertion: signJwt(serviceAccount),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token request failed ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function runReport({ accessToken, property, dateRange, offset }) {
  const response = await fetch(`${GA4_API_BASE_URL}/${property}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      dimensions: reportDimensions.map((name) => ({ name })),
      metrics: reportMetrics.map((name) => ({ name })),
      dateRanges: [
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      ],
      limit: String(REPORT_LIMIT),
      offset: String(offset),
      orderBys: [
        { dimension: { dimensionName: "yearMonth" } },
        { metric: { metricName: "sessions" }, desc: true },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`GA4 runReport failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function runPagedReport({ accessToken, property, dateRange }) {
  const pages = [];
  let offset = 0;
  let rowCount = 0;

  do {
    const page = await runReport({ accessToken, property, dateRange, offset });
    pages.push(page);
    rowCount = Number.parseInt(page.rowCount ?? "0", 10);
    offset += REPORT_LIMIT;
  } while (offset < rowCount);

  return pages;
}

function monthFromYearMonth(value) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
}

function metricNumber(metrics, index) {
  const value = metrics[index]?.value ?? "0";
  return Number(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsFromPages(dateRange, pages) {
  const rows = [];

  for (const page of pages) {
    for (const row of page.rows ?? []) {
      const dimensions = row.dimensionValues ?? [];
      const metrics = row.metricValues ?? [];
      rows.push({
        academic_year: dateRange.academic_year,
        calendar_month: monthFromYearMonth(dimensions[0]?.value ?? ""),
        channel_group: dimensions[1]?.value ?? "(not set)",
        landing_page: dimensions[2]?.value ?? "(not set)",
        sessions: metricNumber(metrics, 0),
        active_users: metricNumber(metrics, 1),
        total_users: metricNumber(metrics, 2),
        new_users: metricNumber(metrics, 3),
        screen_page_views: metricNumber(metrics, 4),
        engaged_sessions: metricNumber(metrics, 5),
        engagement_rate: metricNumber(metrics, 6),
        event_count: metricNumber(metrics, 7),
        key_events: metricNumber(metrics, 8),
        user_engagement_duration_seconds: metricNumber(metrics, 9),
      });
    }
  }

  return rows;
}

function writeCsv(rows) {
  const headers = [
    "academic_year",
    "calendar_month",
    "channel_group",
    "landing_page",
    "sessions",
    "active_users",
    "total_users",
    "new_users",
    "screen_page_views",
    "engaged_sessions",
    "engagement_rate",
    "event_count",
    "key_events",
    "user_engagement_duration_seconds",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const property = normalizePropertyId(requireEnvironment("GA4_PROPERTY_ID"));
  const serviceAccount = readServiceAccount();
  const accessToken = await getAccessToken(serviceAccount);
  const rawReports = [];
  const rows = [];

  for (const dateRange of dateWindows()) {
    const pages = await runPagedReport({ accessToken, property, dateRange });
    rawReports.push({ dateRange, pages });
    rows.push(...rowsFromPages(dateRange, pages));
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(rawPath, JSON.stringify(rawReports, null, 2), "utf8");
  writeCsv(rows);

  console.log(
    JSON.stringify(
      {
        property,
        rows: rows.length,
        output_csv: outputPath,
        raw_json: rawPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
