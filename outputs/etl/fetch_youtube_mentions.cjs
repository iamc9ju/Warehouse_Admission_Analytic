const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "outputs", "real_data");
const outputPath = path.join(outputDir, "youtube_mentions_monthly.csv");
const rawPath = path.join(outputDir, "youtube_videos.json");

const apiKey = process.env.YOUTUBE_API_KEY;

const academicWindows = [
  {
    academic_year: 2568,
    publishedAfter: "2024-12-01T00:00:00Z",
    publishedBefore: "2025-06-30T23:59:59Z",
  },
  {
    academic_year: 2569,
    publishedAfter: "2025-12-01T00:00:00Z",
    publishedBefore: "2026-06-30T23:59:59Z",
  },
];

const keywords = [
  { keyword_group: "brand", keyword_text: "วิศวะเกษตรกำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "วิศวกรรมศาสตร์ กำแพงแสน", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "brand", keyword_text: "KU KPS Engineering", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "TCAS วิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "admissions", keyword_text: "สอบเข้าวิศวะเกษตร", major_id: "ALL", major_name: "All Engineering" },
  { keyword_group: "department", keyword_text: "Computer Engineering KPS", major_id: "E29", major_name: "วิศวกรรมคอมพิวเตอร์" },
];

function requireApiKey() {
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is required. Create an API key in Google Cloud and run with YOUTUBE_API_KEY=...");
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

async function youtubeGet(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API request failed ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function searchVideos(keyword, window) {
  const payload = await youtubeGet("search", {
    part: "snippet",
    type: "video",
    q: keyword.keyword_text,
    maxResults: "25",
    order: "date",
    relevanceLanguage: "th",
    regionCode: "TH",
    publishedAfter: window.publishedAfter,
    publishedBefore: window.publishedBefore,
  });

  return (payload.items ?? []).map((item) => ({
    video_id: item.id?.videoId,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    channel_title: item.snippet?.channelTitle ?? "",
    published_at: item.snippet?.publishedAt ?? "",
    academic_year: window.academic_year,
    keyword_group: keyword.keyword_group,
    keyword_text: keyword.keyword_text,
    major_id: keyword.major_id,
    major_name: keyword.major_name,
  })).filter((video) => video.video_id);
}

async function hydrateVideoStats(videos) {
  const uniqueVideos = [...new Map(videos.map((video) => [video.video_id, video])).values()];
  const hydrated = [];

  for (let index = 0; index < uniqueVideos.length; index += 50) {
    const chunk = uniqueVideos.slice(index, index + 50);
    const payload = await youtubeGet("videos", {
      part: "statistics,snippet",
      id: chunk.map((video) => video.video_id).join(","),
      maxResults: "50",
    });

    const statsById = new Map((payload.items ?? []).map((item) => [item.id, item]));
    for (const video of chunk) {
      const item = statsById.get(video.video_id);
      const statistics = item?.statistics ?? {};
      hydrated.push({
        ...video,
        view_count: Number.parseInt(statistics.viewCount ?? "0", 10),
        like_count: Number.parseInt(statistics.likeCount ?? "0", 10),
        comment_count: Number.parseInt(statistics.commentCount ?? "0", 10),
      });
    }
  }

  return hydrated;
}

function aggregateVideos(videos) {
  const buckets = new Map();

  for (const video of videos) {
    const calendarMonth = monthFromIso(video.published_at);
    const key = [
      video.academic_year,
      calendarMonth,
      video.keyword_group,
      video.keyword_text,
      video.major_id,
      video.major_name,
    ].join("|");

    const current =
      buckets.get(key) ??
      {
        academic_year: video.academic_year,
        calendar_month: calendarMonth,
        platform_name: "YouTube API",
        keyword_group: video.keyword_group,
        keyword_text: video.keyword_text,
        major_id: video.major_id,
        major_name: video.major_name,
        sentiment_label: "Neutral",
        mention_count: 0,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
      };

    current.mention_count += 1;
    current.like_count += video.like_count;
    current.comment_count += video.comment_count;
    current.view_count += video.view_count;
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
  requireApiKey();

  const searchedVideos = [];
  for (const window of academicWindows) {
    for (const keyword of keywords) {
      searchedVideos.push(...(await searchVideos(keyword, window)));
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  const videos = await hydrateVideoStats(searchedVideos);
  const rows = aggregateVideos(videos);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(rawPath, JSON.stringify(videos, null, 2), "utf8");
  writeCsv(rows);

  console.log(
    JSON.stringify(
      {
        raw_videos: videos.length,
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
