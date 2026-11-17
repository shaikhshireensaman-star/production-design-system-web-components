import { test, expect } from "@playwright/test";

test("production demo and docs enforce CSP and block inline script/style", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    addEventListener("securitypolicyviolation", event => {
      window.__cspViolations.push(event.effectiveDirective);
    });
  });
  for (const [url, heading] of [
    ["http://127.0.0.1:43215", "Good morning, Shireen"],
    ["http://127.0.0.1:43217", "Production Design System"]
  ]) {
    const response = await page.goto(url);
    const policy = response?.headers()["content-security-policy"] ?? "";
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("style-src 'self'");
    expect(policy).toContain("worker-src 'self'");
    expect(policy).toContain("object-src 'none'");
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();

    const probe = await page.evaluate(async () => {
      const inlineScript = document.createElement("script");
      inlineScript.textContent = 'document.documentElement.dataset.inlineScriptProbe = "ran"';
      document.head.append(inlineScript);
      const inlineStyle = document.createElement("style");
      inlineStyle.textContent = ":root { --pds-inline-style-probe: injected; }";
      document.head.append(inlineStyle);
      await new Promise(resolve => setTimeout(resolve, 25));
      return {
        scriptRan: document.documentElement.dataset.inlineScriptProbe === "ran",
        styleApplied: getComputedStyle(document.documentElement).getPropertyValue("--pds-inline-style-probe").trim() === "injected",
        violations: window.__cspViolations
      };
    });
    expect(probe.scriptRan).toBe(false);
    expect(probe.styleApplied).toBe(false);
    expect(probe.violations).toContain("script-src-elem");
    expect(probe.violations).toContain("style-src-elem");
  }
});
