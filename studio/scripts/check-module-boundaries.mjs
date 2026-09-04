import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const PURE_MODULES = new Set(["document", "commands", "compiler", "expressions", "legacy"]);
const OUTWARD_MODULES = new Set(["editor", "projects", "runtime", "platform"]);
const FORBIDDEN_PACKAGES = ["react", "react-dom", "next", "zustand"];
const FORBIDDEN_STORAGE_PACKAGES = ["idb", "localforage"];
const BROWSER_GLOBALS = new Set([
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "BroadcastChannel",
  "HTMLElement",
  "Storage",
]);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(target);
  }
  return files;
}

function packageIsForbidden(specifier) {
  return [...FORBIDDEN_PACKAGES, ...FORBIDDEN_STORAGE_PACKAGES].some(
    (name) => specifier === name || specifier.startsWith(`${name}/`),
  );
}

function importedSpecifier(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    return node.moduleSpecifier.text;
  }
  if (ts.isCallExpression(node) && node.arguments.length === 1) {
    const [argument] = node.arguments;
    const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
    if ((isDynamicImport || isRequire) && argument && ts.isStringLiteral(argument)) {
      return argument.text;
    }
  }
  return undefined;
}

function isPropertyName(identifier) {
  const parent = identifier.parent;
  return (ts.isPropertyAccessExpression(parent) && parent.name === identifier)
    || (ts.isPropertyAssignment(parent) && parent.name === identifier)
    || (ts.isPropertySignature(parent) && parent.name === identifier)
    || (ts.isMethodDeclaration(parent) && parent.name === identifier);
}

export async function checkStudioModuleBoundaries(sourceRoot) {
  const failures = [];
  for (const moduleName of PURE_MODULES) {
    const moduleRoot = path.join(sourceRoot, moduleName);
    for (const file of await sourceFiles(moduleRoot)) {
      const relativeFile = path.relative(sourceRoot, file);
      const source = await readFile(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );

      const visit = (node) => {
        const specifier = importedSpecifier(node);
        if (specifier && packageIsForbidden(specifier)) {
          failures.push(`${relativeFile}: pure modules cannot import ${specifier}.`);
        }
        if (specifier?.startsWith(".")) {
          const target = path.resolve(path.dirname(file), specifier);
          const relativeTarget = path.relative(sourceRoot, target);
          const [targetModule] = relativeTarget.split(path.sep);
          if (targetModule && OUTWARD_MODULES.has(targetModule)) {
            failures.push(`${relativeFile}: pure modules cannot import src/${targetModule}.`);
          }
        }
        if (ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text) && !isPropertyName(node)) {
          const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          failures.push(
            `${relativeFile}:${position.line + 1}: pure modules cannot use browser global ${node.text}.`,
          );
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
    }
  }
  return failures.sort();
}

async function main() {
  const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
  const failures = await checkStudioModuleBoundaries(sourceRoot);
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log("Studio pure-module boundary check passed");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
