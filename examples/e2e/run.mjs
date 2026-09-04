import { spawnSync } from "node:child_process";

const input = process.argv.slice(2);
const adapterIndex = input.indexOf("--adapter");
const adapter = adapterIndex === -1 ? undefined : input[adapterIndex + 1];
if (adapterIndex !== -1) input.splice(adapterIndex, 2);
const args = ["playwright", "test", ...input, ...(adapter === undefined ? [] : ["--project", adapter])];
const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ...(adapter === undefined ? {} : { STAGES_ADAPTER: adapter }) },
});
process.exitCode = result.status ?? 1;
