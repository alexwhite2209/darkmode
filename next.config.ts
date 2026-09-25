import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

/**
 * GITHUB_PAGES=1 builds a static copy for GitHub Pages into out/ (see .github/workflows/pages.yml):
 * everything is prerendered, the site lives under NEXT_PUBLIC_BASE_PATH (/darkmode).
 * Without it: the normal Next.js server build (npm run build && npm start).
 */
const pages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath,
  images: { formats: ["image/avif", "image/webp"], unoptimized: pages },
  ...(pages
    ? { output: "export" as const }
    : {
        async headers() {
          return [
            { source: "/video/:path*", headers: longCache },
            { source: "/fonts/:path*", headers: longCache },
          ];
        },
      }),
};

export default nextConfig;
