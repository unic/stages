import { defineConfig, devices } from "@playwright/test";

const adapters = [
  { name: "vanilla", port: 4171 },
  { name: "react", port: 4172 },
  { name: "vue", port: 4173 },
  { name: "angular", port: 4174 },
] as const;

export default defineConfig({
  testDir: ".",
  testMatch: ["event-launch.spec.ts", "studio-editor.spec.ts"],
  fullyParallel: true,
  workers: process.env["CI"] ? 2 : 4,
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    ...adapters.map(({ name, port }) => ({
      name,
      testMatch: "event-launch.spec.ts",
      use: { baseURL: `http://127.0.0.1:${port}` },
    })),
    {
      name: "studio",
      testMatch: "studio-editor.spec.ts",
      use: { baseURL: "http://127.0.0.1:3010" },
    },
  ],
  webServer: [
    ...adapters.filter(({ name }) => process.env["STAGES_ADAPTER"] === undefined || process.env["STAGES_ADAPTER"] === name).map(({ name, port }) => ({
    command: name === "angular"
      ? `npm --prefix ../angular run dev -- --host 127.0.0.1 --port ${port}`
      : `npm --prefix ../${name} run dev -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
    })),
    ...(process.env["STAGES_ADAPTER"] === undefined || process.env["STAGES_ADAPTER"] === "studio" ? [{
      command: "npm --prefix ../../studio run dev -- --hostname 127.0.0.1 --port 3010",
      url: "http://127.0.0.1:3010/demo-v1",
      reuseExistingServer: !process.env["CI"],
      timeout: 120_000,
    }] : []),
  ],
});
