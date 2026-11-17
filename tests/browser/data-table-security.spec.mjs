import { test, expect } from "@playwright/test";

test("Data Table rejects unsafe URLs and malformed worker messages", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  const table = page.locator("#security-table");
  await page.evaluate(() => {
    const element = document.createElement("pds-data-table");
    element.id = "security-table";
    element.setAttribute("src", "javascript:document.documentElement.dataset.xss='ran'");
    document.body.append(element);
  });
  await expect(table.locator(".status")).toContainText("must use HTTP or HTTPS");
  const worker = await page.evaluate(() => {
    const element = document.querySelector("#security-table");
    element.worker.postMessage({ type: "query", id: "invalid", filter: "", sortKey: "id", direction: "asc" });
    return true;
  });
  expect(worker).toBe(true);
  await expect(table.locator(".status")).toHaveText("Invalid table worker query.");
  expect(await page.locator("html").getAttribute("data-xss")).toBeNull();
});

test("NDJSON boundaries skip malformed or unsafe rows and render text without executing markup", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  await page.route("**/security-feed.ndjson", route => route.fulfill({
    status: 200,
    contentType: "application/x-ndjson",
    body: '{"id":"<img src=x onerror=alert(1)>","name":"<script>document.documentElement.dataset.xss=\\"ran\\"</script>"}\n{"bad key":"rejected"}\n{invalid json}\n'
  }));
  await page.evaluate(() => {
    const element = document.createElement("pds-data-table");
    element.id = "safe-feed";
    element.setAttribute("src", "/security-feed.ndjson");
    document.body.append(element);
  });
  const table = page.locator("#safe-feed");
  await expect(table.locator(".status")).toContainText("1 matching row");
  await expect(table.locator("tbody td").nth(1)).toHaveText("<script>document.documentElement.dataset.xss=\"ran\"</script>");
  await expect(table.locator("img, script")).toHaveCount(0);
  expect(await page.locator("html").getAttribute("data-xss")).toBeNull();
});
