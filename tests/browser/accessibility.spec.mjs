import { test, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core"), "utf8");

test("documented component examples have no serious or critical axe violations", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Axe scan runs once in Chromium; journeys cover all engines.");
  const scans = [];
  for (const theme of ["light", "dark", "high-contrast"]) {
    const page = await browser.newPage();
    await page.addInitScript({ content: axeSource });
    await page.goto(`http://127.0.0.1:43214/?theme=${theme}`);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const result = await page.evaluate(async () => {
      const findings = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
      const rootStyles = getComputedStyle(document.documentElement);
      const button = document.querySelector("pds-button")?.shadowRoot?.querySelector("button");
      const rowLink = document.querySelector("pds-data-table")?.shadowRoot?.querySelector(".row-link");
      const linkColor = rowLink ? getComputedStyle(rowLink).color : "";
      const linkBackground = rootStyles.getPropertyValue("--pds-surface").trim();
      const channel = (hex, index) => {
        const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      const luminance = hex => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
      const foregroundHex = `#${linkColor.match(/\d+/g).map(value => Number(value).toString(16).padStart(2, "0")).join("")}`;
      const [lighter, darker] = [luminance(foregroundHex), luminance(linkBackground)].sort((a, b) => b - a);
      return { violations: findings.violations, themeTokens: { primary: rootStyles.getPropertyValue("--pds-primary").trim(), primaryText: rootStyles.getPropertyValue("--pds-primary-text").trim(), link: rootStyles.getPropertyValue("--pds-link").trim(), linkColor, linkBackground, linkContrastRatio: Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2)), buttonBackground: button ? getComputedStyle(button).backgroundColor : null, buttonColor: button ? getComputedStyle(button).color : null } };
    });
    scans.push({ theme, ...result });
    await page.close();
  }
  const serious = scans.flatMap(scan => scan.violations.filter(violation => ["critical", "serious"].includes(violation.impact)).map(violation => ({ theme: scan.theme, violation })));
  const lowContrastLinks = scans.filter(scan => scan.themeTokens.linkContrastRatio < 4.5).map(scan => ({ theme: scan.theme, ratio: scan.themeTokens.linkContrastRatio }));
  const details = serious.map(({ theme, violation }) => ({ theme, id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, failure: node.failureSummary })) }));
  await mkdir(new URL("../../reports/", import.meta.url), { recursive: true });
  await writeFile(new URL("../../reports/accessibility-report.json", import.meta.url), JSON.stringify({ engine: "axe-core", version: "4.14.0", scope: "documented component catalog in three themes", tags: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"], violationCount: scans.reduce((sum, scan) => sum + scan.violations.length, 0), scans: scans.map(scan => ({ theme: scan.theme, tokens: scan.themeTokens, violations: scan.violations.map(violation => ({ id: violation.id, impact: violation.impact, help: violation.help, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) })), seriousOrCritical: details }, null, 2));
  expect(serious, JSON.stringify(details, null, 2)).toEqual([]);
  expect(lowContrastLinks, JSON.stringify(lowContrastLinks)).toEqual([]);
});
