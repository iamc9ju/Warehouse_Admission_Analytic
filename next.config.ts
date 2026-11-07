import type { NextConfig } from "next";

function normalizeBasePath(raw?: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const basePath = normalizeBasePath(
  process.env.BASE_PATH ??
    process.env.NEXT_PUBLIC_BASE_PATH ??
    process.env.BASEPATH ??
    process.env.NEXT_PUBLIC_BASEPATH,
);

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
