// Targeted screenshots: node probe.mjs <name> <width> <height> <mobile 0|1> <spec...>
// spec: "<cssSelectorOrId>@<fraction>" — scrolls so the element's pinned range is at <fraction>
//       ("#top@0.5" = halfway through the hero), or "y=1234" for an absolute scroll position.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [name, w, h, mob, ...specs] = process.argv.slice(2);
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "qa", name);
fs.mkdirSync(OUT, { recursive: true });
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mobile = mob === "1";
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--hide-scrollbars"],
  defaultViewport: { width: +w, height: +h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto((process.env.BASE || "http://localhost:3100") + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => !document.querySelector("[data-preloader]"), { timeout: 20000 }).catch(() => {});
await sleep(1500);
let i = 0;
for (const s of specs) {
  let y;
  if (s.startsWith("y=")) y = +s.slice(2);
  else {
    const [sel, f] = s.split("@");
    y = await page.evaluate(
      (sel, f) => {
        const el = document.querySelector(sel);
        if (!el) return 0;
        const top = el.getBoundingClientRect().top + scrollY;
        const range = Math.max(0, el.offsetHeight - innerHeight);
        return Math.round(top + range * f);
      },
      sel,
      +f,
    );
  }
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await sleep(1400);
  const label = String(i++).padStart(2, "0") + "_" + s.replace(/[^a-z0-9@.=]+/gi, "_");
  await page.screenshot({ path: path.join(OUT, label + ".png") });
}
console.log(name, "done", specs.length, "shots; errors:", errors.length, errors.slice(0, 5).join(" | "));
await browser.close();
