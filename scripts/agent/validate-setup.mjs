import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findUnmappedActiveDirectories, repositoryRoot } from "./impact-map.mjs";

export const expectedAgentFiles = [
  "AGENTS.md",
  "src/AGENTS.md",
  "packages/AGENTS.md",
  "packages/core/AGENTS.md",
  "examples/AGENTS.md",
  "examples/shared/event-launch/AGENTS.md",
  "studio/AGENTS.md",
  "docs/AGENTS.md",
];

export const expectedSkills = [
  "stages-find-context",
  "stages-verify-change",
  "stages-change-api",
  "stages-update-docs",
  "stages-prepare-release",
];

const ignoredDirectories = new Set([
  ".git", ".next", ".angular", "coverage", "dist", "node_modules", "out", "playwright-report", "test-results",
]);
const generatedPathPattern = /(?:^|[/(])(?:dist|\.next|out|coverage|playwright-report|test-results)(?:[/)]|$)/;

function filesRecursively(root, relativeDirectory = "") {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  const files = [];
  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) files.push(...filesRecursively(root, relativePath));
    else files.push(relativePath);
  }
  return files;
}

export function instructionFilesForPath(root, relativeTarget = "") {
  const target = relativeTarget.replaceAll("\\", "/").replace(/^\.\//, "");
  const targetPath = path.join(root, target);
  const targetDirectory = existsSync(targetPath) && statSync(targetPath).isDirectory()
    ? target
    : path.posix.dirname(target);
  const segments = targetDirectory === "." ? [] : targetDirectory.split("/").filter(Boolean);
  const instructions = [];
  for (let depth = 0; depth <= segments.length; depth += 1) {
    const candidate = path.posix.join(...segments.slice(0, depth), "AGENTS.md");
    if (existsSync(path.join(root, candidate))) instructions.push(candidate);
  }
  return instructions;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return undefined;
  const values = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (!field) continue;
    values[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return { values, body: source.slice(match[0].length) };
}

function validateSkillMetadata(root, skillName, failures) {
  const relativeFile = `.agents/skills/${skillName}/agents/openai.yaml`;
  const absoluteFile = path.join(root, relativeFile);
  if (!existsSync(absoluteFile)) {
    failures.push(`Missing skill UI metadata: ${relativeFile}`);
    return;
  }
  const source = readFileSync(absoluteFile, "utf8");
  const value = (key) => source.match(new RegExp(`^\\s*${key}:\\s*"([^"]*)"\\s*$`, "m"))?.[1];
  if (!value("display_name")) failures.push(`${relativeFile}: interface.display_name is required`);
  const shortDescription = value("short_description");
  if (!shortDescription || shortDescription.length < 25 || shortDescription.length > 64) {
    failures.push(`${relativeFile}: interface.short_description must contain 25-64 characters`);
  }
  const defaultPrompt = value("default_prompt");
  if (!defaultPrompt?.includes(`$${skillName}`)) {
    failures.push(`${relativeFile}: interface.default_prompt must mention $${skillName}`);
  }
  if (skillName === "stages-prepare-release" && !/^\s*allow_implicit_invocation:\s*false\s*$/m.test(source)) {
    failures.push(`${relativeFile}: release preparation must disable implicit invocation`);
  }
}

function packageScripts(root, manifestCache, prefix = ".") {
  const manifestPath = path.join(root, prefix, "package.json");
  if (!manifestCache.has(manifestPath)) {
    try {
      manifestCache.set(manifestPath, JSON.parse(readFileSync(manifestPath, "utf8")).scripts ?? {});
    } catch {
      manifestCache.set(manifestPath, undefined);
    }
  }
  return manifestCache.get(manifestPath);
}

function validateReferences(root, relativeFile, source, failures, manifestCache) {
  const markdownTargets = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const rawTarget of markdownTargets) {
    if (/^(?:https?:|#|mailto:)/.test(rawTarget)) continue;
    const target = rawTarget.replace(/^<|>$/g, "").split("#")[0];
    const resolved = target.startsWith("/") ? path.join(root, target) : path.resolve(root, path.dirname(relativeFile), target);
    if (!existsSync(resolved)) failures.push(`${relativeFile}: referenced path does not exist: ${rawTarget}`);
    const repositoryRelative = path.relative(root, resolved).replaceAll("\\", "/");
    if (generatedPathPattern.test(repositoryRelative)) {
      failures.push(`${relativeFile}: generated output must not be referenced as editable source: ${rawTarget}`);
    }
  }

  const rootScriptMatches = source.matchAll(/npm run ([\w:.-]+)/g);
  for (const match of rootScriptMatches) {
    const scripts = packageScripts(root, manifestCache);
    if (!scripts?.[match[1]]) failures.push(`${relativeFile}: root package script does not exist: ${match[1]}`);
  }

  const prefixMatches = source.matchAll(/npm --prefix ([^\s`]+) run ([\w:.-]+)/g);
  for (const match of prefixMatches) {
    const scripts = packageScripts(root, manifestCache, match[1]);
    if (!scripts?.[match[2]]) failures.push(`${relativeFile}: ${match[1]} package script does not exist: ${match[2]}`);
  }

  const nodeFiles = source.matchAll(/(?:^|[`\s])node ([\w./-]+\.(?:mjs|js))(?:[`\s]|$)/gm);
  for (const match of nodeFiles) {
    if (!existsSync(path.join(root, match[1]))) failures.push(`${relativeFile}: referenced executable does not exist: ${match[1]}`);
  }
}

export function validateSetup(root = repositoryRoot, options = {}) {
  const agents = options.expectedAgentFiles ?? expectedAgentFiles;
  const skills = options.expectedSkills ?? expectedSkills;
  const failures = [];
  const manifestCache = new Map();

  for (const relativeFile of agents) {
    if (!existsSync(path.join(root, relativeFile))) failures.push(`Missing expected instruction file: ${relativeFile}`);
  }

  for (const relativeFile of filesRecursively(root)) {
    if (path.posix.basename(relativeFile) === "AGENT.md") failures.push(`Use AGENTS.md, not AGENT.md: ${relativeFile}`);
  }

  const skillRoot = path.join(root, ".agents/skills");
  const descriptions = new Map();
  for (const skillName of skills) {
    const relativeFile = `.agents/skills/${skillName}/SKILL.md`;
    if (!existsSync(path.join(root, relativeFile))) failures.push(`Missing expected skill: ${relativeFile}`);
  }

  if (existsSync(skillRoot)) {
    for (const entry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const relativeFile = `.agents/skills/${entry.name}/SKILL.md`;
      const absoluteFile = path.join(root, relativeFile);
      if (!existsSync(absoluteFile)) {
        failures.push(`Skill directory is missing SKILL.md: .agents/skills/${entry.name}`);
        continue;
      }
      const source = readFileSync(absoluteFile, "utf8");
      const frontmatter = parseFrontmatter(source);
      if (!frontmatter) {
        failures.push(`${relativeFile}: missing YAML frontmatter`);
        continue;
      }
      if (frontmatter.values.name !== entry.name) {
        failures.push(`${relativeFile}: frontmatter name must match directory name (${entry.name})`);
      }
      const description = frontmatter.values.description;
      if (!description) failures.push(`${relativeFile}: description is required`);
      else {
        if (description.length > 200) failures.push(`${relativeFile}: description must be at most 200 characters`);
        const owner = descriptions.get(description);
        if (owner) failures.push(`${relativeFile}: description duplicates ${owner}`);
        else descriptions.set(description, relativeFile);
      }
      if (frontmatter.body.split("\n").length > 250) failures.push(`${relativeFile}: body exceeds 250 lines`);
      if (/\bTODO\b/.test(source)) failures.push(`${relativeFile}: unresolved TODO placeholder`);
      validateReferences(root, relativeFile, source, failures, manifestCache);
      validateSkillMetadata(root, entry.name, failures);
    }
  }

  for (const relativeFile of agents.filter((file) => existsSync(path.join(root, file)))) {
    validateReferences(root, relativeFile, readFileSync(path.join(root, relativeFile), "utf8"), failures, manifestCache);
  }

  for (const directory of findUnmappedActiveDirectories(root)) {
    failures.push(`Active package or example has no impact mapping: ${directory}`);
  }

  return failures;
}

function run() {
  const failures = validateSetup();
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Agent setup validation passed.");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
