// Renders the /print summary edition to an A4 PDF.
// usage: npm run dev (another terminal) → npm run pdf [-- <url> <out.pdf>]
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:3001/print/";
const out = process.argv[3] ?? "허건_포트폴리오.pdf";

const browser = await chromium
  .launch({ channel: "chrome" })
  .catch(() => chromium.launch({ executablePath: process.env.CHROME_PATH }));
const page = await browser.newPage({
  colorScheme: "light",
  viewport: { width: 794, height: 1123 },
});
await page.goto(url, { waitUntil: "load", timeout: 120_000 });
await page.waitForSelector(".print-root[data-ready]", { timeout: 60_000 });
await page.evaluate(async () => {
  await document.fonts.ready;
  // lazy images below the fold never load in a headless print, so force them and cap the wait
  const images = [...document.images];
  for (const img of images) img.loading = "eager";
  await Promise.all(
    images.map((img) =>
      img.complete
        ? null
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 10_000);
          }),
    ),
  );
});

// a sheet is a fixed A4 box: report any whose content is clipped
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll(".print-sheet")].flatMap((sheet, i) => {
    const body = sheet.querySelector(".print-body");
    const footer = sheet.querySelector(".print-footer");
    const over =
      body.getBoundingClientRect().top +
      body.scrollHeight -
      footer.getBoundingClientRect().top;
    return over > 0 ? [`page ${i + 1}: ${Math.ceil(over)}px over`] : [];
  }),
);

await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`saved ${out}`);
if (overflow.length) {
  console.warn(`overflowing sheets:\n  ${overflow.join("\n  ")}`);
  process.exitCode = 1;
}
