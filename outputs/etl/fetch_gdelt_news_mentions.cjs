const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "outputs", "real_data");
const outputPath = path.join(outputDir, "gdelt_news_mentions_monthly.csv");
const rawPath = path.join(outputDir, "gdelt_news_articles.json");

const academicWindows = [
  {
    academic_year: 2568,
    start: "20241201000000",
    end: "20250630235959",
  },
  {
    academic_year: 2569,
    start: "20251201000000",
    end: "20260630235959",
  },
];

const keywords = [
  {
    keyword_group: "brand",
    keyword_text: "กำแพงแสน วิศวกรรม",
    query: '"กำแพงแสน" "วิศวกรรม"',
    major_id: "ALL",
    major_name: "All Engineering",
  },
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function monthFromSeenDate(seenDate) {
  if (!seenDate || seenDate.length < 6) {
    return null;
  }
  return `${seenDate.slice(0, 4)}-${seenDate.slice(4, 6)}`;
}

function buildUrl(keyword, window) {
  const url = new URL("http://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", keyword.query ?? `"${keyword.keyword_text}"`);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "250");
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("startdatetime", window.start);
  url.searchParams.set("enddatetime", window.end);
  return url;
}

async function fetchArticles(keyword, window) {
  const url = buildUrl(keyword, window);
  let response;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await fetch(url, {
      headers: {
        "user-agent": "warehouse-admissions-analytics/1.0",
      },
    });

    if (response.status !== 429) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 6500 * attempt));
  }

  if (!response.ok) {
    throw new Error(`GDELT request failed ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return (payload.articles ?? []).map((article) => ({
    academic_year: window.academic_year,
    keyword_group: keyword.keyword_group,
    keyword_text: keyword.keyword_text,
    major_id: keyword.major_id,
    major_name: keyword.major_name,
    title: article.title ?? "",
    url: article.url ?? "",
    domain: article.domain ?? "",
    language: article.language ?? "",
    seendate: article.seendate ?? "",
    socialimage: article.socialimage ?? "",
  }));
}

function aggregateArticles(articles) {
  const buckets = new Map();

  for (const article of articles) {
    const calendarMonth = monthFromSeenDate(article.seendate);
    if (!calendarMonth) continue;

    const key = [
      article.academic_year,
      calendarMonth,
      article.keyword_group,
      article.keyword_text,
      article.major_id,
      article.major_name,
    ].join("|");

    const current =
      buckets.get(key) ??
      {
        academic_year: article.academic_year,
        calendar_month: calendarMonth,
        platform_name: "GDELT News",
        keyword_group: article.keyword_group,
        keyword_text: article.keyword_text,
        major_id: article.major_id,
        major_name: article.major_name,
        sentiment_label: "Neutral",
        mention_count: 0,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
      };

    current.mention_count += 1;
    buckets.set(key, current);
  }

  return [...buckets.values()].sort((a, b) =>
    `${a.academic_year}-${a.calendar_month}-${a.keyword_text}`.localeCompare(
      `${b.academic_year}-${b.calendar_month}-${b.keyword_text}`
    )
  );
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

async function main() {
  const articles = [];
  await new Promise((resolve) => setTimeout(resolve, 15000));
  for (const window of academicWindows) {
    for (const keyword of keywords) {
      const keywordArticles = await fetchArticles(keyword, window);
      articles.push(...keywordArticles);
      await new Promise((resolve) => setTimeout(resolve, 5500));
    }
  }

  const rows = aggregateArticles(articles);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(rawPath, JSON.stringify(articles, null, 2), "utf8");
  writeCsv(rows);

  console.log(
    JSON.stringify(
      {
        raw_articles: articles.length,
        monthly_rows: rows.length,
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
