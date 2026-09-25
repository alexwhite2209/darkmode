import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

/**
 * STATIC_EXPORT=1 (npm run build:static) builds plain files for any hosting into out/:
 * every page is prerendered into folder/index.html, so it works on Apache/nginx without settings.
 * NEXT_PUBLIC_BASE_PATH is only needed when the site does not sit at the root of the domain.
 * Without STATIC_EXPORT: the normal Next.js server build (npm run build && npm start).
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath,
  images: { formats: ["image/avif", "image/webp"], unoptimized: isStatic },
  ...(isStatic
    ? { output: "export" as const, trailingSlash: true }
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
