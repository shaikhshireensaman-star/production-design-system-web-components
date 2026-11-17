import { test, expect } from "@playwright/test";

test("ElementInternals form values, validation, reset, disabled fields, restoration, and labels", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.id = "form-association-fixture";
    form.innerHTML = `
      <pds-text-field label="Full name" name="fullName" value="Alex" required></pds-text-field>
      <pds-select label="Plan" name="plan" required options='[{"label":"Starter","value":"starter"},{"label":"Team","value":"team"}]'></pds-select>
      <pds-checkbox label="Accept terms" name="terms" value="accepted" checked></pds-checkbox>
      <pds-radio-group label="Contact method" name="contact" value="email" options='[{"label":"Email","value":"email"},{"label":"Phone","value":"phone"}]'></pds-radio-group>
      <pds-switch label="SMS updates" name="updates" value="sms" checked></pds-switch>
      <fieldset disabled>
        <pds-text-field label="Disabled field" name="disabledField" value="ignore"></pds-text-field>
      </fieldset>`;
    document.body.append(form);
  });

  const form = page.locator("#form-association-fixture");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Plan" })).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "Accept terms" })).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "Email" })).toHaveCount(1);
  await expect(page.getByRole("switch", { name: "SMS updates" })).toHaveCount(1);

  const name = form.locator("pds-text-field").first().locator("input");
  const plan = form.locator("pds-select select");
  const terms = form.locator("pds-checkbox input");
  const email = form.locator('pds-radio-group input[value="email"]');
  const phone = form.locator('pds-radio-group input[value="phone"]');
  const updates = form.locator("pds-switch button");
  const disabledField = form.locator("fieldset pds-text-field input");

  await expect(disabledField).toBeDisabled();
  await name.fill("");
  await plan.selectOption("team");
  expect(await form.evaluate(element => element.checkValidity())).toBe(false);

  await name.fill("Shireen");
  await terms.uncheck();
  await terms.check();
  await phone.check();
  await updates.click();
  await updates.click();
  await expect(updates).toHaveAttribute("aria-checked", "true");
  expect(await form.evaluate(element => element.checkValidity())).toBe(true);
  const submitted = await form.evaluate(element => Object.fromEntries(new FormData(element).entries()));
  expect(submitted).toEqual({ fullName: "Shireen", plan: "team", terms: "accepted", contact: "phone", updates: "sms" });
  expect(submitted).not.toHaveProperty("disabledField");

  await form.evaluate(element => element.reset());
  await expect(name).toHaveValue("Alex");
  await expect(terms).toBeChecked();
  await expect(email).toBeChecked();
  await expect(updates).toHaveAttribute("aria-checked", "true");

  await form.locator("pds-text-field").first().evaluate(element => element.formStateRestoreCallback("Restored from browser state"));
  await expect(name).toHaveValue("Restored from browser state");
});
