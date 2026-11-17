import { test, expect } from "@playwright/test";

test("component keyboard and pointer interactions use accessible controls and native events", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  await page.evaluate(() => {
    const fixture = document.createElement("section");
    fixture.innerHTML = `
      <pds-button id="action">Run action</pds-button>
      <pds-checkbox label="Accept" id="check"></pds-checkbox>
      <pds-switch label="Updates" id="switch"></pds-switch>
      <pds-radio-group label="Contact" id="radio" options='[{"label":"Email","value":"email"},{"label":"Phone","value":"phone"}]'></pds-radio-group>
      <pds-tabs id="tabs"><span slot="tab">First</span><span slot="tab">Second</span><p slot="panel">First panel</p><p slot="panel">Second panel</p></pds-tabs>
      <pds-menu id="menu"><span slot="trigger">Actions</span><button slot="item">Edit</button><button slot="item">Archive</button></pds-menu>
      <pds-rating label="Rating" id="rating"></pds-rating>
      <pds-dialog id="dialog" title="Confirm action"><p>Dialog content</p></pds-dialog>
      <pds-toast id="toast" message="Saved" duration="0"></pds-toast>`;
    document.body.append(fixture);
    window.__pdsClicks = 0;
    fixture.querySelector("#action").addEventListener("click", () => window.__pdsClicks++);
  });

  const action = page.getByRole("button", { name: "Run action" });
  await action.focus();
  await action.press("Enter");
  expect(await page.evaluate(() => window.__pdsClicks)).toBe(1);

  const check = page.getByRole("checkbox", { name: "Accept" });
  await check.check();
  await expect(check).toBeChecked();
  const toggle = page.getByRole("switch", { name: "Updates", exact: true });
  await toggle.focus();
  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  const email = page.getByRole("radio", { name: "Email" });
  await email.focus();
  await email.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Phone" })).toBeChecked();

  const firstTab = page.getByRole("tab", { name: "First" });
  await firstTab.focus();
  await firstTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Actions", exact: true }).click();
  const edit = page.getByRole("menuitem", { name: "Edit" });
  await expect(edit).toBeFocused();
  await edit.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  await page.getByRole("menuitem", { name: "Archive" }).press("Escape");
  await expect(page.getByRole("button", { name: "Actions", exact: true })).toBeFocused();

  const rating = page.locator("#rating").getByRole("button", { name: "4 of 5 stars" });
  await rating.focus();
  await rating.press("Enter");
  await expect(page.locator("#rating")).toHaveAttribute("value", "4");

  await page.locator("#dialog").evaluate(element => element.open());
  await expect(page.getByRole("dialog", { name: "Confirm action" })).toBeVisible();
  await page.getByRole("dialog").press("Escape");
  await expect(page.locator("#dialog")).not.toHaveAttribute("open", "");

  await page.locator("#toast").evaluate(element => element.show());
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeHidden();
});
