// QA harness: drives the installed Chromium (Edge) through the site and saves screenshots.
//   node production/scripts/shoot.mjs [baseUrl] [scenario...]
// scenarios: desktop, mobile, reduced, novideo, tablet
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3100";
const only = process.argv.slice(3);
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "qa");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const heroPs = [0, 0.02, 0.1, 0.18, 0.3, 0.38, 0.47, 0.55, 0.64, 0.72, 0.8, 0.86, 0.92, 0.975, 1.0];

async function run(name, { viewport, reduced = false, blockVideo = false, ua }) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-first-run", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"],
    defaultViewport: viewport,
  });
  const page = await browser.newPage();
  if (ua) await page.setUserAgent(ua);
  const errors = [];
  const videoReqs = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("/video/")) {
      videoReqs.push(req.url());
      if (blockVideo) return req.abort();
    }
    req.continue();
  });
  const t0 = Date.now();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  // wait for the preloader to open (or give up after 15 s)
  await page.waitForFunction(() => !document.querySelector("[data-preloader]"), { timeout: 15000 }).catch(() => {});
  const readyMs = Date.now() - t0;
  await sleep(1800);
  const info = await page.evaluate(() => ({
    vh: innerHeight,
    vw: innerWidth,
    heroH: document.getElementById("top")?.offsetHeight ?? 0,
    video: document.querySelector("[data-video]")?.getAttribute("data-video"),
    sections: ["projects", "services", "process", "media", "contact"].map((id) => [id, document.getElementById(id)?.offsetTop ?? -1, document.getElementById(id)?.offsetHeight ?? -1]),
    docH: document.documentElement.scrollHeight,
  }));
  const shot = async (label) => page.screenshot({ path: path.join(dir, `${label}.png`) });
  const scrollTo = async (y, wait = 1300) => {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(wait);
  };
  await shot("00-load");
  if (info.heroH > info.vh * 2) {
    const range = info.heroH - info.vh;
    for (const p of heroPs) {
      await scrollTo(Math.round(p * range), 1500);
      await shot(`hero-${String(Math.round(p * 1000)).padStart(4, "0")}`);
    }
  }
  for (const [id, top, h] of info.sections) {
    if (top < 0) continue;
    const steps = h > info.vh * 1.5 ? [0, 0.3, 0.6, 0.9] : [0];
    for (const s of steps) {
      const y = Math.round(top + s * Math.max(0, h - info.vh));
      await scrollTo(y, 1100);
      await shot(`${id}-${Math.round(s * 100)}`);
    }
  }
  await scrollTo(info.docH, 900);
  await shot("zz-end");
  fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify({ readyMs, info, errors, videoReqs }, null, 2));
  console.log(name, "ready", readyMs, "ms; video:", info.video, "; errors:", errors.length, "; video requests:", videoReqs.length);
  if (errors.length) console.log(errors.slice(0, 8).join("\n"));
  await browser.close();
}

const scenarios = {
  desktop: { viewport: { width: 1440, height: 900, deviceScaleFactor: 1 } },
  tablet: { viewport: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
  mobile: {
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  },
  reduced: { viewport: { width: 1440, height: 900 }, reduced: true },
  novideo: { viewport: { width: 1440, height: 900 }, blockVideo: true },
};

for (const [name, cfg] of Object.entries(scenarios)) {
  if (only.length && !only.includes(name)) continue;
  try {
    await run(name, cfg);
  } catch (e) {
    console.error(name, "FAILED", e.message);
  }
}
