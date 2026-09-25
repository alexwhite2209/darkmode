/**
 * Public files (images, video, frames, fonts) live under the site's base path.
 * Locally it is empty; on GitHub Pages the site sits at /darkmode, set by NEXT_PUBLIC_BASE_PATH at build.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (p: string) => (p.startsWith("/") ? BASE_PATH + p : p);
