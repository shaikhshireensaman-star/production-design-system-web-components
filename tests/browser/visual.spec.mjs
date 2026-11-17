import { test, expect } from "@playwright/test";

const components = ["button", "text-field", "select", "checkbox", "rating", "tabs", "dialog", "menu", "toast", "card", "data-table"];

for (const theme of ["light", "dark"]) {
  for (const width of [390, 1280]) {
    test(`required component visuals · ${theme} · ${width}px`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Reference images are captured once in Chromium.");
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`http://127.0.0.1:43214/?theme=${theme}`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator("pds-data-table").waitFor();
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, pres: [...document.querySelectorAll("pre")].slice(0, 2).map(element => ({ rect: element.getBoundingClientRect().toJSON(), width: getComputedStyle(element).width, maxWidth: getComputedStyle(element).maxWidth, overflow: getComputedStyle(element).overflowX, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })), offenders: [...document.querySelectorAll("body *")].map(element => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return { tag: element.tagName.toLowerCase(), text: element.textContent?.trim().slice(0, 90), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, overflowX: style.overflowX, parent: element.parentElement?.tagName.toLowerCase() }; }).filter(element => element.right > innerWidth + 1).slice(0, 8) }));
      expect(overflow.documentWidth, `Horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(width);

      for (const component of components) {
        const article = page.locator("#components article").filter({ has: page.locator(`h3 code:text-is("pds-${component}")`) });
        await expect(article, `missing docs example for pds-${component}`).toHaveCount(1);
        await expect(article).toHaveScreenshot(`component-${component}-${theme}-${width}.png`, { animations: "disabled" });
      }
    });
  }
}
