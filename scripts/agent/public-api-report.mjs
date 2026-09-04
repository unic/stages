import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const publicPackages = ["core", "dom", "react", "vue", "angular", "test-kit"];

function declarationFiles(directory, relativeDirectory = "") {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...declarationFiles(absolutePath, relativePath));
    else if (entry.name.endsWith(".d.ts")) files.push(relativePath);
  }
  return files.sort();
}

export function canonicalizeDeclaration(source, fileName = "index.d.ts") {
  const withoutSourceMap = source.replace(/^\/\/# sourceMappingURL=.*(?:\r?\n|$)/gm, "").trim();
  const sourceFile = ts.createSourceFile(fileName, withoutSourceMap, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const diagnostics = sourceFile.parseDiagnostics;
  if (diagnostics.length > 0) {
    const detail = diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("; ");
    throw new Error(`Cannot parse ${fileName}: ${detail}`);
  }
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false }).printFile(sourceFile).trim();
}

export function createPackageReport(root, packageName) {
  const packageDirectory = path.join(root, "packages", packageName);
  const manifestPath = path.join(packageDirectory, "package.json");
  const declarationDirectory = path.join(packageDirectory, "dist");
  if (!existsSync(manifestPath)) throw new Error(`Missing package manifest: packages/${packageName}/package.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const files = declarationFiles(declarationDirectory);
  if (files.length === 0) {
    throw new Error(`No emitted declarations found for ${manifest.name}; run npm run build:v1 first.`);
  }
  return {
    package: manifest.name,
    files: files.map((relativePath) => ({
      path: relativePath,
      declaration: canonicalizeDeclaration(
        readFileSync(path.join(declarationDirectory, relativePath), "utf8"),
        relativePath,
      ),
    })),
  };
}

export function reportJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function updateReports(root = repositoryRoot, packageNames = publicPackages) {
  const outputDirectory = path.join(root, "contracts/public-api");
  mkdirSync(outputDirectory, { recursive: true });
  for (const packageName of packageNames) {
    writeFileSync(path.join(outputDirectory, `${packageName}.api.json`), reportJson(createPackageReport(root, packageName)));
  }
}

export function checkReports(root = repositoryRoot, packageNames = publicPackages) {
  const failures = [];
  for (const packageName of packageNames) {
    let expected;
    try {
      expected = reportJson(createPackageReport(root, packageName));
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const relativeReport = `contracts/public-api/${packageName}.api.json`;
    const reportPath = path.join(root, relativeReport);
    if (!existsSync(reportPath)) failures.push(`Missing public API report: ${relativeReport}`);
    else if (readFileSync(reportPath, "utf8") !== expected) {
      failures.push(`Public API changed: ${relativeReport} (run with --update for an intentional change)`);
    }
  }
  return failures;
}

function run() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--check", "--update"].includes(args[0])) {
    console.error("Usage: node scripts/agent/public-api-report.mjs --check|--update");
    process.exitCode = 2;
    return;
  }
  if (args[0] === "--update") {
    updateReports();
    console.log(`Updated ${publicPackages.length} public API reports.`);
    return;
  }
  const failures = checkReports();
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Checked ${publicPackages.length} public API reports.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
