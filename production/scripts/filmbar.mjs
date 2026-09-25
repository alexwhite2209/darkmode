// Film loading bar on a ~20 Mbit/s connection: state and percent every second, one screenshot mid-load.
//   node production/scripts/filmbar.mjs http://localhost:3400/darkmode/ [mobile]
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
const url = process.argv[2];
const mobile = process.argv[3] === "mobile";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "qa", `filmbar${mobile ? "_m" : ""}.png`);
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, defaultViewport: mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900 } });
const page = await browser.newPage();
const cdp = await page.createCDPSession();
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: (20 * 1024 * 1024) / 8, uploadThroughput: 1e6 });
await page.goto(url, { waitUntil: "domcontentloaded" });
let shot = false;
for (let s = 1; s <= 30; s++) {
  await new Promise((r) => setTimeout(r, 1000));
  const st = await page.evaluate(() => {
    const b = document.querySelector('[role="progressbar"]');
    return { pre: !!document.querySelector("[data-preloader]"), state: b?.dataset.state, text: b?.textContent };
  });
  console.log(`${s}s`, JSON.stringify(st));
  if (!shot && st.state === "on") {
    await page.screenshot({ path: out });
    shot = true;
  }
  if (st.state === "done") break;
}
await browser.close();
