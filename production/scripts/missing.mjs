// Lists requests that fail (4xx/5xx) while the home page loads and scrolls to the end.
//   node production/scripts/missing.mjs http://localhost:3300/darkmode/
import puppeteer from "puppeteer-core";
const url = process.argv[2] || "http://localhost:3100/";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const bad = new Set();
page.on("response", (r) => r.status() >= 400 && bad.add(`${r.status()} ${r.url()}`));
page.on("requestfailed", (r) => !/ERR_ABORTED/.test(r.failure()?.errorText || "") && bad.add(`FAIL ${r.url()} ${r.failure()?.errorText}`));
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
for (let y = 0; y < 60; y++) {
  await page.evaluate(() => window.scrollBy(0, innerHeight * 0.8));
  await new Promise((r) => setTimeout(r, 120));
}
await new Promise((r) => setTimeout(r, 2000));
console.log(bad.size ? [...bad].join("\n") : "no failed requests");
await browser.close();
