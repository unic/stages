import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { instructionFilesForPath, validateSetup } from "./validate-setup.mjs";

const mappedDirectories = [
  "packages/core", "packages/dom", "packages/react", "packages/vue", "packages/angular", "packages/test-kit",
  "examples/vanilla", "examples/react", "examples/vue", "examples/angular", "examples/e2e", "examples/shared/event-launch",
];

function write(root, relativePath, contents = "") {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function writeMetadata(root, skillName, shortDescription = "Verify a small example workflow") {
  write(root, `.agents/skills/${skillName}/agents/openai.yaml`, [
    "interface:",
    `  display_name: "${skillName}"`,
    `  short_description: "${shortDescription}"`,
    `  default_prompt: "Use $${skillName} for this task."`,
    "",
  ].join("\n"));
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "stages-agent-setup-"));
  write(root, "package.json", JSON.stringify({ scripts: { "check:v1": "true" } }));
  for (const directory of mappedDirectories) write(root, `${directory}/package.json`, "{}");
  return root;
}

test("accepts a valid minimal setup", async () => {
  const root = await fixture();
  try {
    write(root, "AGENTS.md", "Use `npm run check:v1`.\n");
    write(root, ".agents/skills/example-skill/SKILL.md", [
      "---",
      "name: example-skill",
      "description: Verify a small example workflow.",
      "---",
      "",
      "Read [the instructions](../../../AGENTS.md), then run `npm run check:v1`.",
      "",
    ].join("\n"));
    writeMetadata(root, "example-skill");
    assert.deepEqual(validateSetup(root, {
      expectedAgentFiles: ["AGENTS.md"],
      expectedSkills: ["example-skill"],
    }), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports missing and singular instruction files", async () => {
  const root = await fixture();
  try {
    write(root, "src/AGENT.md", "wrong name\n");
    assert.deepEqual(validateSetup(root, {
      expectedAgentFiles: ["AGENTS.md"],
      expectedSkills: [],
    }), [
      "Missing expected instruction file: AGENTS.md",
      "Use AGENTS.md, not AGENT.md: src/AGENT.md",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validates skill identity, descriptions, references, scripts, and size", async () => {
  const root = await fixture();
  try {
    write(root, ".agents/skills/first/SKILL.md", [
      "---",
      "name: mismatched",
      `description: ${"x".repeat(201)}`,
      "---",
      "",
      "See [missing](references/missing.md) and run `npm run absent`.",
      ...Array.from({ length: 251 }, () => "line"),
    ].join("\n"));
    const failures = validateSetup(root, { expectedAgentFiles: [], expectedSkills: ["first"] });
    assert(failures.some((failure) => failure.includes("frontmatter name must match")));
    assert(failures.some((failure) => failure.includes("description must be at most 200")));
    assert(failures.some((failure) => failure.includes("referenced path does not exist")));
    assert(failures.some((failure) => failure.includes("root package script does not exist")));
    assert(failures.some((failure) => failure.includes("body exceeds 250 lines")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects duplicate descriptions and generated source references", async () => {
  const root = await fixture();
  try {
    const frontmatter = (name) => `---\nname: ${name}\ndescription: Same workflow.\n---\n`;
    write(root, ".agents/skills/first/SKILL.md", `${frontmatter("first")}See [output](../../../packages/core/dist/index.js).\n`);
    write(root, ".agents/skills/second/SKILL.md", frontmatter("second"));
    write(root, "packages/core/dist/index.js", "");
    const failures = validateSetup(root, { expectedAgentFiles: [], expectedSkills: ["first", "second"] });
    assert(failures.some((failure) => failure.includes("description duplicates")));
    assert(failures.some((failure) => failure.includes("generated output must not be referenced")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects an active application without an impact rule", async () => {
  const root = await fixture();
  try {
    write(root, "examples/svelte/package.json", "{}");
    assert(validateSetup(root, { expectedAgentFiles: [], expectedSkills: [] })
      .includes("Active package or example has no impact mapping: examples/svelte"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validates skill UI metadata and executable references", async () => {
  const root = await fixture();
  try {
    write(root, ".agents/skills/release/SKILL.md", [
      "---", "name: release", "description: Prepare a release safely.", "---", "",
      "Run `node scripts/missing.mjs`. TODO", "",
    ].join("\n"));
    writeMetadata(root, "release", "short");
    const failures = validateSetup(root, { expectedAgentFiles: [], expectedSkills: ["release"] });
    assert(failures.some((failure) => failure.includes("short_description")));
    assert(failures.some((failure) => failure.includes("referenced executable does not exist")));
    assert(failures.some((failure) => failure.includes("unresolved TODO")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers instructions from root to each active subtree", () => {
  const repository = path.resolve(import.meta.dirname, "../..");
  assert.deepEqual(instructionFilesForPath(repository, "package.json"), ["AGENTS.md"]);
  assert.deepEqual(instructionFilesForPath(repository, "packages/core/src/controller.ts"), [
    "AGENTS.md", "packages/AGENTS.md", "packages/core/AGENTS.md",
  ]);
  assert.deepEqual(instructionFilesForPath(repository, "docs/content/index.mdx"), [
    "AGENTS.md", "docs/AGENTS.md",
  ]);
  assert.deepEqual(instructionFilesForPath(repository, "studio/components/store.js"), [
    "AGENTS.md", "studio/AGENTS.md",
  ]);
});
