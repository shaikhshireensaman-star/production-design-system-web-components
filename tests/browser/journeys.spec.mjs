import { test, expect } from "@playwright/test";

test("reservations journey: stream, filter, and sort", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  const table = page.locator("pds-data-table");
  await expect(table.locator(".status")).toContainText("50000 matching rows", {
    timeout: 90_000,
  });
  await table.getByRole("searchbox", { name: "Filter table rows" }).fill("Customer 1");
  await expect(table.locator(".status")).toContainText("matching rows");
  await expect(table.locator("tbody tr").first()).toContainText("Customer 1");
  await table.getByRole("button", { name: "total" }).click();
  await expect(table.locator("tbody tr")).toHaveCount(100);
  await table.getByRole("button", { name: /^View ORD-/ }).first().click();
  await expect(page.locator("#reservation-dialog dialog")).toHaveAttribute("open", "");
  await expect(page.locator("#reservation-detail")).toContainText("customer:");
});

test("guest preferences journey: save form and announce confirmation", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  await page.locator("#preferences pds-text-field input").fill("Jordan Lee");
  await page.locator("#preferences pds-select select").selectOption("king");
  await page.locator("#preferences").locator('button[type="submit"]').click();
  await expect(page.locator("#saved-toast").locator(".toast")).toContainText(
    "Guest preferences saved."
  );
});

test("theme and reservation journey: switch theme and open details dialog", async ({ page }) => {
  await page.goto("http://127.0.0.1:43213");
  await page.getByRole("combobox", { name: "Choose color theme" }).selectOption("high-contrast");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "high-contrast");
  await page.locator(".component-examples details summary").click();
  await page.locator("#open-details").click();
  await expect(page.locator("#reservation-dialog dialog")).toHaveAttribute("open", "");
});

test("stream cancellation journey: abort an in-progress feed", async ({ page }) => {
  await page.route("**/mock/orders.ndjson", route =>
    route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: "",
    })
  );
  await page.goto("http://127.0.0.1:43213");
  await page.evaluate(() => {
    const table = document.createElement("pds-data-table");
    table.id = "cancellable-feed";
    table.setAttribute("src", "/mock/slow-orders.ndjson");
    document.body.append(table);
  });
  const table = page.locator("#cancellable-feed");
  await expect(table.locator(".status")).toContainText(/Loaded \d+ rows/, {
    timeout: 15_000,
  });
  await table.getByRole("button", { name: "Cancel" }).click();
  await expect(table.locator(".status")).toContainText("Loading cancelled");
});

test("server-rendered button and card keep their declarative shadow roots on upgrade", async ({ page }) => {
  await page.goto("http://127.0.0.1:43214");
  const result = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML =
      '<pds-button><template shadowrootmode="open"><button part="button" class="primary"><slot></slot></button></template>Continue</pds-button><pds-card title="Server card"><template shadowrootmode="open"><article class="card" part="base"><header><h2 class="title"></h2></header><div class="content" part="content"><slot></slot></div><footer part="footer"><slot name="footer"></slot></footer></article></template>Body</pds-card>';
    document.body.append(host);
    const button = host.querySelector("pds-button");
    const card = host.querySelector("pds-card");

    return {
      buttonText: button?.textContent?.trim(),
      buttonHasShadowSlot: Boolean(button?.shadowRoot?.querySelector("button slot")),
      buttonChildren: button?.shadowRoot?.childElementCount,
      cardTitle: card?.shadowRoot?.querySelector("h2")?.textContent,
      cardChildren: card?.shadowRoot?.childElementCount,
    };
  });

  expect(result).toEqual({
    buttonText: "Continue",
    buttonHasShadowSlot: true,
    buttonChildren: 1,
    cardTitle: "Server card",
    cardChildren: 1,
  });
});

test("production service worker serves the demo shell while offline", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:43215");
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await expect(page.getByRole("heading", { name: "Good morning, Shireen" })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Good morning, Shireen" })).toBeVisible();
  await context.setOffline(false);
});

test("React 19 integration receives a native custom event", async ({ page }) => {
  await page.goto("http://127.0.0.1:43216");
  await page.getByRole("button", { name: "5 of 5 stars" }).click();
  await expect(page.getByText("Your rating: 5 of 5")).toBeVisible();
});