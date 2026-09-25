// After `next build` with output: "export" (GitHub Pages):
// 1. .nojekyll, so GitHub Pages serves the _next folder
// 2. Next 16 writes route prefetch payloads as nested folders (news/__next.$d$kind/__PAGE__.txt)
//    but requests them by flat names (news/__next.$d$kind.__PAGE__.txt); copy each one to its flat name.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.argv[2] || "out");
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

let n = 0;
const walkFiles = (dir, rel = []) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkFiles(path.join(dir, e.name), [...rel, e.name]) : [{ file: path.join(dir, e.name), rel: [...rel, e.name] }],
  );

const visit = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      for (const f of walkFiles(full)) {
        const flat = path.join(dir, [e.name, ...f.rel].join("."));
        if (!fs.existsSync(flat)) {
          fs.copyFileSync(f.file, flat);
          n++;
        }
      }
    } else visit(full);
  }
};
visit(OUT);
console.log(`pages-postexport: .nojekyll + ${n} flat prefetch files`);
