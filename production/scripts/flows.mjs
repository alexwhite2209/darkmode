// Functional checks against a running server: timings, dialog + form, keyboard, article page, API, SEO files.
//   node production/scripts/flows.mjs http://localhost:3200
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3200";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "qa", "flows");
fs.mkdirSync(OUT, { recursive: true });
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, defaultViewport: { width: 1440, height: 900 } });

// 1. cold load timings with a throttled network (~20 Mbit/s, 40 ms RTT)
{
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: (20 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const t0 = Date.now();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  const dcl = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector("[data-preloader]"), { timeout: 30000 }).catch(() => {});
  const preloaderGone = Date.now() - t0;
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = Object.fromEntries(performance.getEntriesByType("paint").map((p) => [p.name, Math.round(p.startTime)]));
    const res = performance.getEntriesByType("resource");
    const bytes = res.reduce((s, r) => s + (r.transferSize || 0), 0);
    const byType = {};
    for (const r of res) {
      const k = r.initiatorType;
      byType[k] = (byType[k] || 0) + (r.transferSize || 0);
    }
    return { ttfb: Math.round(nav.responseStart), domInteractive: Math.round(nav.domInteractive), paint, kb: Math.round(bytes / 1024), byTypeKb: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])) };
  });
  const lcp = await page.evaluate(
    () =>
      new Promise((res) => {
        let v = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) v = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => res(Math.round(v)), 300);
      }),
  );
  const cls = await page.evaluate(
    () =>
      new Promise((res) => {
        let v = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => res(Math.round(v * 1000) / 1000), 300);
      }),
  );
  results.load = { dcl, preloaderGone, lcp, cls, ...perf, errors };
  await page.close();
}

// 2. dialog + form + keyboard
{
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle2" });
  await page.waitForFunction(() => !document.querySelector("[data-preloader]"), { timeout: 30000 }).catch(() => {});
  await sleep(800);
  // keyboard: first Tab lands on the skip link
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  // the main button is a phone link; on a computer it scrolls to the finale with the contacts
  const callHref = await page.evaluate(() => document.querySelector("header .btn--primary")?.getAttribute("href"));
  await page.click("header .btn--primary");
  await sleep(3200);
  const atFinale = await page.evaluate(() => {
    const el = document.getElementById("contact-end");
    return el ? Math.abs(scrollY - (el.offsetTop + el.offsetHeight - innerHeight)) < 40 : false;
  });
  await page.screenshot({ path: path.join(OUT, "finale.png") });
  const finaleLinks = await page.evaluate(() => [...document.querySelectorAll("#contact-end a")].map((a) => a.getAttribute("href")));
  // tabs keyboard in Media
  await page.evaluate(() => document.getElementById("media")?.scrollIntoView());
  await sleep(900);
  await page.focus('[role="tab"][aria-selected="true"]');
  await page.keyboard.press("ArrowRight");
  await sleep(300);
  const tabNow = await page.evaluate(() => document.activeElement?.textContent?.trim());
  results.flows = { firstFocus, callHref, atFinale, finaleLinks, tabNow, errors };
  await page.close();
}

// 3. article page + API + SEO files
{
  const page = await browser.newPage();
  const r = await page.goto(BASE + "/articles/scroll-video-vs-slider", { waitUntil: "networkidle2" });
  await page.waitForFunction(() => !document.querySelector("[data-preloader]"), { timeout: 15000 }).catch(() => {});
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "article.png"), fullPage: false });
  const seo = await page.evaluate(() => ({
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    h1: document.querySelectorAll("h1").length,
    ld: !!document.querySelector('script[type="application/ld+json"]'),
  }));
  const api = {};
  for (const ep of ["news", "articles", "guides", "projects", "content"]) {
    const res = await page.evaluate(async (u) => {
      const x = await fetch(u);
      const j = await x.json();
      return [x.status, Array.isArray(j.items) ? j.items.length : Object.keys(j).length];
    }, BASE + "/api/" + ep);
    api[ep] = res;
  }
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
  const missing = await (await fetch(BASE + "/articles/nope")).status;
  const kinds = {};
  for (const k of ["news", "articles", "guides", "media"]) kinds[k] = (await fetch(BASE + "/" + k)).status;
  results.kinds = kinds;
  results.article = { status: r.status(), seo, api, robots: robots.split("\n").slice(0, 4), sitemapUrls: (sitemap.match(/<loc>/g) || []).length, notFoundStatus: missing };
  await page.close();
}

fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
