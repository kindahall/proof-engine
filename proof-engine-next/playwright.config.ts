import { defineConfig, devices } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const envLocalPath = resolve(process.cwd(), ".env.local")
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const index = line.indexOf("=")
    if (index <= 0) continue
    const key = line.slice(0, index)
    const value = line.slice(index + 1)
    process.env[key] ??= value
  }
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const webServerPort = new URL(baseURL).port || "3000"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  workers: 1,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm exec next dev -p ${webServerPort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
