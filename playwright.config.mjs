import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", testIgnore: ["**/accessibility.spec.mjs", "**/visual.spec.mjs"], use: { browserName: "firefox" } },
    { name: "webkit", testIgnore: ["**/accessibility.spec.mjs", "**/visual.spec.mjs"], use: { browserName: "webkit" } }
  ],
  webServer: {
    command: "node tests/browser/server.mjs",
    url: "http://127.0.0.1:43213",
    reuseExistingServer: process.env.PDS_EXTERNAL_TEST_SERVERS === "1",
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 }
  }
});
