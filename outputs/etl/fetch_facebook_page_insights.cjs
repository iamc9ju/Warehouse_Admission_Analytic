const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "outputs", "real_data");
const outputPath = path.join(outputDir, "facebook_page_mentions_monthly.csv");
const rawPath = path.join(outputDir, "facebook_page_posts.json");

const apiVersion = process.env.FACEBOOK_GRAPH_API_VERSION ?? "v23.0";
const pageId = process.env.FACEBOOK_PAGE_ID;
const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

const academicWindows = [
  {
    academic_year: 2568,
    since: "2024-12-01T00:00:00+07:00",
    until: "2025-06-30T23:59:59+07:00",
  },
  {
    academic_year: 2569,
    since: "2025-12-01T00:00:00+07:00",
    until: "2026-06-30T23:59:59+07:00",
  },
];

const keywords = [
  { keyword_group: "brand", keyword_text: "วิศวะเกษตรกำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "วิศวกรรมศาสตร์ กำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "KU KPS Engineering", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "TCAS วิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "สอบเข้าวิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "รับสมัคร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "department", keyword_text: "Computer Engineering KPS", major_id: "E29", major_name: "วิศวกรรมคอมพิวเตอร์" },
];

const fallbackKeyword = {
  keyword_group: "page",
  keyword_text: "Facebook Page posts",
  major_id: "ALL",
  major_name: "All Engineering",
};

function requireEnvironment() {
  if (!pageId) {
    throw new Error("FACEBOOK_PAGE_ID is required");
  }

  if (!pageAccessToken) {
    throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is required");
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function monthFromIso(value) {
  return value.slice(0, 7);
}

function unixSeconds(value) {
  return Math.floor(new Date(value).getTime() / 1000);
}

function numberValue(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function apiUrl(graphPath, params = {}) {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${graphPath.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("access_token", pageAccessToken);
  return url;
}

async function facebookGet(graphPath, params) {
  const response = await fetch(apiUrl(graphPath, params));
  const payload = await response.json();

  if (!response.ok || payload.error) {
    const message = payload.error?.message ?? response.statusText;
    const code = payload.error?.code ? ` code ${payload.error.code}` : "";
    throw new Error(`Facebook Graph API request failed${code}: ${message}`);
  }

  return payload;
}

async function facebookGetPage(url) {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok || payload.error) {
    const message = payload.error?.message ?? response.statusText;
    const code = payload.error?.code ? ` code ${payload.error.code}` : "";
    throw new Error(`Facebook Graph API pagination request failed${code}: ${message}`);
  }

  return payload;
}

async function fetchPostsForWindow(window) {
  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "shares",
    "comments.limit(0).summary(true)",
    "reactions.limit(0).summary(total_count)",
    "insights.metric(post_impressions,post_engaged_users,post_clicks,post_video_views)",
  ].join(",");

  const posts = [];
  let payload = await facebookGet(`/${pageId}/posts`, {
    fields,
    since: unixSeconds(window.since),
    until: unixSeconds(window.until),
    limit: 100,
  });

  while (true) {
    posts.push(
      ...(payload.data ?? []).map((post) => ({
        ...post,
        academic_year: window.academic_year,
      }))
    );

    if (!payload.paging?.next) {
      break;
    }

    payload = await facebookGetPage(payload.paging.next);
  }

  return posts;
}

function postText(post) {
  return `${post.message ?? ""} ${post.permalink_url ?? ""}`.toLowerCase();
}

function classifyKeyword(post) {
  const text = postText(post);
  return (
    keywords.find((keyword) => text.includes(keyword.keyword_text.toLowerCase())) ??
    fallbackKeyword
  );
}

function insightMetric(post, metricName) {
  const metric = post.insights?.data?.find((item) => item.name === metricName);
  const value = metric?.values?.[0]?.value;

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return numberValue(value);
  }

  return 0;
}

function normalizePost(post) {
  return {
    post_id: post.id,
    message: post.message ?? "",
    created_time: post.created_time,
    permalink_url: post.permalink_url ?? "",
    academic_year: post.academic_year,
    reaction_count: numberValue(post.reactions?.summary?.total_count),
    comment_count: numberValue(post.comments?.summary?.total_count),
    share_count: numberValue(post.shares?.count),
    impression_count: insightMetric(post, "post_impressions"),
    engaged_user_count: insightMetric(post, "post_engaged_users"),
    click_count: insightMetric(post, "post_clicks"),
    video_view_count: insightMetric(post, "post_video_views"),
  };
}

function aggregatePosts(posts) {
  const buckets = new Map();

  for (const post of posts.map(normalizePost)) {
    const keyword = classifyKeyword(post);
    const calendarMonth = monthFromIso(post.created_time);
    const key = [
      post.academic_year,
      calendarMonth,
      keyword.keyword_group,
      keyword.keyword_text,
      keyword.major_id,
      keyword.major_name,
    ].join("|");

    const current =
      buckets.get(key) ??
      {
        academic_year: post.academic_year,
        calendar_month: calendarMonth,
        platform_name: "Facebook Page API",
        keyword_group: keyword.keyword_group,
        keyword_text: keyword.keyword_text,
        major_id: keyword.major_id,
        major_name: keyword.major_name,
        sentiment_label: "Neutral",
        mention_count: 0,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
      };

    current.mention_count += 1;
    current.like_count += post.reaction_count;
    current.comment_count += post.comment_count;
    current.share_count += post.share_count;
    current.view_count += post.impression_count || post.video_view_count;
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
  requireEnvironment();

  const posts = [];
  for (const window of academicWindows) {
    posts.push(...(await fetchPostsForWindow(window)));
  }

  const normalizedPosts = posts.map(normalizePost);
  const rows = aggregatePosts(posts);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(rawPath, JSON.stringify(normalizedPosts, null, 2), "utf8");
  writeCsv(rows);

  console.log(
    JSON.stringify(
      {
        raw_posts: normalizedPosts.length,
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
