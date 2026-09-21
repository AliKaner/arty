import { defineConfig } from "@playwright/test";
export default defineConfig({
  workers: 1,
  testDir: "tests/e2e",
  timeout: 60000,
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
