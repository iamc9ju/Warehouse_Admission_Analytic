const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const inputPath = process.env.SOCIAL_LISTENING_EXPORT_CSV;
const outputDir = path.join(rootDir, "outputs", "real_data");
const outputPath =
  process.env.SOCIAL_LISTENING_OUTPUT_CSV ??
  path.join(outputDir, "social_listening_mentions_monthly.csv");
const rawPath =
  process.env.SOCIAL_LISTENING_OUTPUT_JSON ??
  path.join(outputDir, "social_listening_mentions_normalized.json");

const defaultPlatform = process.env.SOCIAL_LISTENING_DEFAULT_PLATFORM ?? "Facebook";
const vendorName = process.env.SOCIAL_LISTENING_VENDOR ?? "Social Listening Export";

const academicWindows = [
  {
    academic_year: 2568,
    start: new Date("2024-12-01T00:00:00+07:00"),
    end: new Date("2025-06-30T23:59:59+07:00"),
  },
  {
    academic_year: 2569,
    start: new Date("2025-12-01T00:00:00+07:00"),
    end: new Date("2026-06-30T23:59:59+07:00"),
  },
];

const keywords = [
  { keyword_group: "brand", keyword_text: "วิศวะเกษตรกำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "วิศวกรรมศาสตร์ กำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "KU KPS Engineering", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "วิศวะ KU", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "TCAS วิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "สอบเข้าวิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "เข้าวิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "รับสมัครวิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "review", keyword_text: "รีวิววิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "department", keyword_text: "Computer Engineering KPS", major_id: "E29", major_name: "วิศวกรรมคอมพิวเตอร์" },
  { keyword_group: "department", keyword_text: "Mechanical Engineering KPS", major_id: "E03", major_name: "วิศวกรรมเครื่องกล" },
  { keyword_group: "department", keyword_text: "Civil Engineering KPS", major_id: "E38", major_name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน" },
];

const aliases = {
  date: [
    "date",
    "datetime",
    "published_at",
    "publishedat",
    "created_time",
    "createdtime",
    "created_at",
    "createdat",
    "post_date",
    "mention_date",
    "timestamp",
    "วันที่",
    "วันเวลา",
  ],
  platform: ["platform", "source", "channel", "media", "site", "network", "แหล่งที่มา", "ช่องทาง"],
  text: ["text", "content", "message", "body", "caption", "title", "post_text", "mention_text", "ข้อความ", "เนื้อหา"],
  keyword: ["keyword", "matched_keyword", "query", "search_keyword", "คำค้น", "คีย์เวิร์ด"],
  sentiment: ["sentiment", "sentiment_label", "tone", "polarity", "ความรู้สึก"],
  like: ["like", "likes", "like_count", "reaction", "reactions", "reaction_count", "engagement_like"],
  comment: ["comment", "comments", "comment_count"],
  share: ["share", "shares", "share_count", "retweet", "retweets"],
  view: ["view", "views", "view_count", "reach", "impression", "impressions", "impression_count"],
  engagement: ["engagement", "engagement_count", "interactions", "total_engagement"],
  url: ["url", "link", "permalink", "post_url"],
  author: ["author", "username", "user", "account", "page", "profile"],
};

function requireInput() {
  if (!inputPath) {
    throw new Error("SOCIAL_LISTENING_EXPORT_CSV is required");
  }

  if (!fs.existsSync(inputPath)) {
    throw new Error(`SOCIAL_LISTENING_EXPORT_CSV does not exist: ${inputPath}`);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header, index) =>
    normalizeHeader(index === 0 ? header.replace(/^\uFEFF/, "") : header)
  );

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`Invalid CSV row ${rowIndex + 2}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function valueFor(row, aliasKey) {
  for (const name of aliases[aliasKey]) {
    const normalizedName = normalizeHeader(name);
    if (row[normalizedName] != null && row[normalizedName] !== "") {
      return row[normalizedName];
    }
  }
  return "";
}

function numberValue(value) {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const thaiDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+.*)?$/);
  if (thaiDate) {
    const [, day, month, year] = thaiDate;
    const normalizedYear = Number(year) > 2400 ? Number(year) - 543 : Number(year);
    const parsed = new Date(`${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function academicYearFor(date) {
  return academicWindows.find((window) => date >= window.start && date <= window.end)?.academic_year;
}

function calendarMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeSentiment(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (["positive", "pos", "บวก", "เชิงบวก"].includes(text)) return "Positive";
  if (["negative", "neg", "ลบ", "เชิงลบ"].includes(text)) return "Negative";
  return "Neutral";
}

function classifyKeyword(row, text) {
  const exportedKeyword = valueFor(row, "keyword");
  const lookupText = `${exportedKeyword} ${text}`.toLowerCase();
  const matched = keywords.find((keyword) => lookupText.includes(keyword.keyword_text.toLowerCase()));

  if (matched) {
    return matched;
  }

  if (exportedKeyword) {
    return {
      keyword_group: "exported",
      keyword_text: exportedKeyword,
      major_id: "ALL",
      major_name: "All Engineering",
    };
  }

  return {
    keyword_group: "unclassified",
    keyword_text: "Unclassified social listening mention",
    major_id: "ALL",
    major_name: "All Engineering",
  };
}

function normalizeMention(row, rowNumber) {
  const date = parseDate(valueFor(row, "date"));
  if (!date) {
    return { skipped: true, reason: `row ${rowNumber}: missing or invalid date` };
  }

  const academicYear = academicYearFor(date);
  if (!academicYear) {
    return { skipped: true, reason: `row ${rowNumber}: outside configured admissions windows` };
  }

  const text = valueFor(row, "text");
  const keyword = classifyKeyword(row, text);
  const likeCount = numberValue(valueFor(row, "like"));
  const commentCount = numberValue(valueFor(row, "comment"));
  const shareCount = numberValue(valueFor(row, "share"));
  const viewCount = numberValue(valueFor(row, "view"));
  const engagementCount = numberValue(valueFor(row, "engagement"));

  return {
    skipped: false,
    source_vendor: vendorName,
    academic_year: academicYear,
    calendar_month: calendarMonth(date),
    platform_name: valueFor(row, "platform") || defaultPlatform,
    keyword_group: keyword.keyword_group,
    keyword_text: keyword.keyword_text,
    major_id: keyword.major_id,
    major_name: keyword.major_name,
    sentiment_label: normalizeSentiment(valueFor(row, "sentiment")),
    mention_count: 1,
    like_count: likeCount || engagementCount,
    comment_count: commentCount,
    share_count: shareCount,
    view_count: viewCount,
    text,
    url: valueFor(row, "url"),
    author: valueFor(row, "author"),
  };
}

function aggregateMentions(mentions) {
  const buckets = new Map();

  for (const mention of mentions) {
    const key = [
      mention.academic_year,
      mention.calendar_month,
      mention.platform_name,
      mention.keyword_group,
      mention.keyword_text,
      mention.major_id,
      mention.major_name,
      mention.sentiment_label,
    ].join("|");

    const current =
      buckets.get(key) ??
      {
        academic_year: mention.academic_year,
        calendar_month: mention.calendar_month,
        platform_name: mention.platform_name,
        keyword_group: mention.keyword_group,
        keyword_text: mention.keyword_text,
        major_id: mention.major_id,
        major_name: mention.major_name,
        sentiment_label: mention.sentiment_label,
        mention_count: 0,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
      };

    current.mention_count += mention.mention_count;
    current.like_count += mention.like_count;
    current.comment_count += mention.comment_count;
    current.share_count += mention.share_count;
    current.view_count += mention.view_count;
    buckets.set(key, current);
  }

  return [...buckets.values()].sort((a, b) =>
    `${a.academic_year}-${a.calendar_month}-${a.platform_name}-${a.keyword_text}`.localeCompare(
      `${b.academic_year}-${b.calendar_month}-${b.platform_name}-${b.keyword_text}`
    )
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(rows) {
  const headers = [
    "academic_year",
    "calendar_month",
    "platform_name",
    "keyword_group",
    "keyword_text",
    "major_id",
    "major_name",
    "sentiment_label",
    "mention_count",
    "like_count",
    "comment_count",
    "share_count",
    "view_count",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  requireInput();

  const sourceRows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  const normalized = [];
  const skipped = [];

  sourceRows.forEach((row, index) => {
    const mention = normalizeMention(row, index + 2);
    if (mention.skipped) {
      skipped.push(mention.reason);
      return;
    }
    normalized.push(mention);
  });

  const monthlyRows = aggregateMentions(normalized);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(rawPath, JSON.stringify({ normalized, skipped }, null, 2), "utf8");
  writeCsv(monthlyRows);

  console.log(
    JSON.stringify(
      {
        vendor: vendorName,
        source_rows: sourceRows.length,
        normalized_mentions: normalized.length,
        skipped_rows: skipped.length,
        monthly_rows: monthlyRows.length,
        output_csv: outputPath,
        normalized_json: rawPath,
      },
      null,
      2
    )
  );
}

main();
