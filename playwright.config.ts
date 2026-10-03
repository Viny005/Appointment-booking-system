import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", fullyParallel: false, workers: 1,
  use: { baseURL: "http://127.0.0.1:3218", browserName: "chromium", trace: "off", screenshot: "off" },
  webServer: { command: "npm run start -- --hostname 127.0.0.1 --port 3218", url: "http://127.0.0.1:3218/manage", reuseExistingServer: false, timeout: 60000,
    env: { ...process.env, BETTER_AUTH_URL: "https://127.0.0.1:3218" } },
});
