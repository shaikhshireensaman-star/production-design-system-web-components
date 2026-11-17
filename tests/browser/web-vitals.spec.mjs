import { test, expect } from "@playwright/test";

test("web-vitals reports observed LCP, CLS, and INP metrics to the host page", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Field metric lifecycle is exercised once in Chromium.");
  await page.addInitScript(() => {
    window.addEventListener("pds-web-vital", event => {
      const metrics = JSON.parse(localStorage.getItem("pds-test-web-vitals") ?? "[]");
      metrics.push(event.detail);
      localStorage.setItem("pds-test-web-vitals", JSON.stringify(metrics));
    });
    new PerformanceObserver(list => {
      const shifts = JSON.parse(localStorage.getItem("pds-test-layout-shifts") ?? "[]");
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        const sources = entry.sources?.map(source => {
          const node = source.node;
          return {
            node: node?.nodeName,
            selector: node instanceof Element ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}` : "",
            previousRect: source.previousRect.toJSON(),
            currentRect: source.currentRect.toJSON()
          };
        });
        shifts.push({ value: entry.value, sources });
      }
      localStorage.setItem("pds-test-layout-shifts", JSON.stringify(shifts));
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("http://127.0.0.1:43213");
  await expect(page.locator("#orders-table .status")).toContainText("50000 matching rows", { timeout: 90_000 });
  await page.getByRole("group", { name: "Rate this dashboard" }).getByRole("button", { name: "5 of 5 stars" }).click();
  await page.waitForTimeout(300);
  await page.reload();
  const metrics = await page.evaluate(() => JSON.parse(localStorage.getItem("pds-test-web-vitals") ?? "[]"));
  const layoutShifts = await page.evaluate(() => JSON.parse(localStorage.getItem("pds-test-layout-shifts") ?? "[]"));
  console.log(JSON.stringify({ metrics, layoutShifts }));
  expect(metrics.some(metric => metric.name === "LCP" && Number.isFinite(metric.value))).toBe(true);
  expect(metrics.some(metric => metric.name === "CLS" && Number.isFinite(metric.value))).toBe(true);
  expect(metrics.some(metric => metric.name === "INP" && Number.isFinite(metric.value))).toBe(true);
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(new URL("../../reports/", import.meta.url), { recursive: true });
  await writeFile(new URL("../../reports/web-vitals-browser.json", import.meta.url), JSON.stringify({ engine: "Chromium", metrics, layoutShifts }, null, 2));
});
