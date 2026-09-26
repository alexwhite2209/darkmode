// Builds the site as plain files for any hosting:  npm run build:static
//   -> out/               the site (upload its CONTENTS to the root of the domain, e.g. public_html)
//   -> darkmode-site.zip  the same, packed
// Domain for SEO (canonical, sitemap, Open Graph): NEXT_PUBLIC_SITE_URL, e.g.
//   $env:NEXT_PUBLIC_SITE_URL="https://example.ru"; npm run build:static
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "out");
const ZIP = path.join(ROOT, "darkmode-site.zip");
// --pages: the GitHub Pages copy (https://alexwhite2209.github.io/darkmode/), placed in the root of the repo
const PAGES = process.argv.includes("--pages");
const env = { ...process.env, STATIC_EXPORT: "1" };
if (PAGES) {
  env.NEXT_PUBLIC_BASE_PATH = "/darkmode";
  env.NEXT_PUBLIC_SITE_URL = "https://alexwhite2209.github.io/darkmode";
}

fs.rmSync(OUT, { recursive: true, force: true });
const r = spawnSync("npx", ["next", "build"], { cwd: ROOT, stdio: "inherit", shell: true, env });
if (r.status !== 0) process.exit(r.status ?? 1);

// Next 16 writes route prefetch payloads as nested folders (news/__next.$d$kind/__PAGE__.txt) but requests
// them by flat names (news/__next.$d$kind.__PAGE__.txt): copy each one to its flat name.
const walkFiles = (dir, rel = []) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkFiles(path.join(dir, e.name), [...rel, e.name]) : [{ file: path.join(dir, e.name), rel: [...rel, e.name] }],
  );
let flat = 0;
const visit = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      for (const f of walkFiles(full)) {
        const to = path.join(dir, [e.name, ...f.rel].join("."));
        if (!fs.existsSync(to)) (fs.copyFileSync(f.file, to), flat++);
      }
    } else visit(full);
  }
};
visit(OUT);

// Apache hosting: own 404 page, correct types, long cache for heavy media (their addresses carry ?v=)
fs.writeFileSync(
  path.join(OUT, ".htaccess"),
  `ErrorDocument 404 /404.html
AddType image/webp .webp
AddType font/woff2 .woff2
AddType video/mp4 .mp4
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/plain application/json image/svg+xml
</IfModule>
`,
);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

if (PAGES) {
  // GitHub Pages serves the root of `main`: copy the build there, replacing the previous copy
  // (its entries are listed in .pages-files, so the source folders are never touched)
  const LIST = path.join(ROOT, ".pages-files");
  const old = fs.existsSync(LIST) ? fs.readFileSync(LIST, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
  for (const e of old) fs.rmSync(path.join(ROOT, e), { recursive: true, force: true });
  const entries = fs.readdirSync(OUT).filter((e) => e !== ".htaccess");
  const clash = entries.filter((e) => fs.existsSync(path.join(ROOT, e)));
  if (clash.length) {
    console.error("these names already exist in the project root:", clash.join(", "));
    process.exit(1);
  }
  for (const e of entries) fs.cpSync(path.join(OUT, e), path.join(ROOT, e), { recursive: true });
  fs.writeFileSync(LIST, entries.join("\n") + "\n");
  console.log(`\nGitHub Pages copy: ${entries.length} entries in the project root (listed in .pages-files)`);
  process.exit(0);
}

fs.rmSync(ZIP, { force: true });
const z = spawnSync("tar", ["-a", "-c", "-f", ZIP, "-C", OUT, "."], { stdio: "inherit", shell: false });
if (z.status !== 0) process.exit(z.status ?? 1);

const size = (p) => fs.statSync(p).size;
const count = walkFiles(OUT).length;
console.log(`\nstatic site: ${OUT} (${count} files, ${flat} prefetch copies)`);
console.log(`zip: ${ZIP} (${(size(ZIP) / 1e6).toFixed(1)} MB)`);
