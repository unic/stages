import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { commandDependencies, commands, repositoryRoot } from "./impact-map.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const under = (file, directory) => file === directory || file.startsWith(`${directory}/`);
const packageCommand = /^(build|test|typecheck):(core|dom|react|vue|angular|test-kit|authoring)$/;
// Shell nesting and macOS launch-service identifiers change between invocations
// without changing the environment observed by the compiler or application.
const incidentalEnvironment = new Set(["SHLVL", "_", "XPC_SERVICE_NAME"]);

function policyFor(id) {
  const match = id.match(packageCommand);
  if (match) {
    const [, kind, name] = match;
    const directory = `packages/${name}`;
    return {
      includes: (file) => under(file, directory) && (kind !== "build" || (!under(file, `${directory}/test`) && !under(file, `${directory}/test-d`)))
        || name === "authoring" && kind === "test" && (under(file, "examples/shared/event-launch") || under(file, "scripts/portable")),
      outputs: kind === "build" ? [`${directory}/dist`] : [],
    };
  }
  if (["build:shared-example", "test:shared-example"].includes(id)) {
    return {
      includes: (file) => under(file, "examples/shared/event-launch") && (id !== "build:shared-example" || !under(file, "examples/shared/event-launch/test")),
      outputs: id === "build:shared-example" ? ["examples/shared/event-launch/dist"] : [],
    };
  }
  // Setup validation inspects repository topology and references outside .agents.
  if (id === "check:agent-setup") return { includes: () => true, outputs: [] };
  // Release, fallback, browser, application and global quality gates always run.
  return undefined;
}

function sourceFiles(root) {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Cannot inventory verification inputs");
  return [...new Set(result.stdout.split("\0").filter(Boolean))].sort();
}

function fileContent(root, file) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) return "missing";
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) return `link:${readlinkSync(absolute)}:${digest(readFileSync(absolute))}`;
  if (!stat.isFile()) return `directory:${stat.mtimeMs}`;
  return `${stat.mode}:${digest(readFileSync(absolute))}`;
}

function outputDigest(root, directories) {
  const entries = [];
  function walk(relative) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) return;
    if (lstatSync(absolute).isDirectory()) {
      for (const name of readdirSync(absolute).sort()) walk(`${relative}/${name}`);
    } else entries.push([relative, fileContent(root, relative)]);
  }
  for (const directory of directories) {
    const count = entries.length;
    walk(directory);
    if (entries.length === count) return undefined;
  }
  return digest(JSON.stringify(entries));
}

export function createVerificationCache(options = {}) {
  const root = options.root ?? repositoryRoot;
  const cachePath = options.cachePath ?? path.join(tmpdir(), `stages-verification-${digest(root).slice(0, 20)}.json`);
  const environment = options.environment ?? process.env;
  const context = digest(JSON.stringify([process.version, process.platform, process.arch,
    Object.entries(environment).filter(([key]) => !incidentalEnvironment.has(key)).sort(([a], [b]) => a.localeCompare(b))]));
  let records = {};
  try {
    const saved = JSON.parse(readFileSync(cachePath, "utf8"));
    if (saved.version === 1 && saved.context === context) records = saved.records ?? {};
  } catch { /* Missing or corrupt evidence is a cache miss. */ }

  function fingerprint(id, { includeOwnOutput = true } = {}) {
    const policy = policyFor(id);
    if (!policy) return undefined;
    const files = sourceFiles(root);
    const common = (file) => /(?:^|\/)(?:package(?:-lock)?\.json|npm-shrinkwrap\.json|\.npmrc|\.nvmrc)$/.test(file)
      || /^tsconfig.*\.json$/.test(file) || under(file, "scripts/agent");
    const inputs = files.filter((file) => common(file) || policy.includes(file))
      .map((file) => [file, fileContent(root, file)]);
    // npm's hidden install lock and directory stamp invalidate evidence on reinstall.
    for (const directory of [".", ...files.filter((file) => file.endsWith("/package.json")).map((file) => path.posix.dirname(file))]) {
      inputs.push([`${directory}/node_modules`, fileContent(root, `${directory}/node_modules`)]);
      inputs.push([`${directory}/node_modules/.package-lock.json`, fileContent(root, `${directory}/node_modules/.package-lock.json`)]);
    }
    const dependencies = (commandDependencies[id] ?? []).map((dependency) => [dependency, fingerprint(dependency)]);
    if (dependencies.some(([, value]) => value === undefined)) return undefined;
    const output = outputDigest(root, includeOwnOutput ? policy.outputs : []);
    if (output === undefined) return undefined;
    return digest(JSON.stringify([context, commands[id], inputs, dependencies, output]));
  }

  function save() {
    writeFileSync(cachePath, JSON.stringify({ version: 1, context, records }), { mode: 0o600 });
  }

  return {
    fingerprint,
    has(id) {
      const current = fingerprint(id);
      return current !== undefined && records[id] === current;
    },
    forget(id) {
      delete records[id];
      save();
    },
    record(id) {
      const current = fingerprint(id);
      if (current !== undefined) records[id] = current;
      save();
    },
  };
}
