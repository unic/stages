import nextra from "nextra";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const withNextra = nextra({});
const docsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(docsRoot, "..");
const localStagesAliases = {
  "@stages/core": resolve(repositoryRoot, "packages/core/dist/index.js"),
  "@stages/react": resolve(repositoryRoot, "packages/react/dist/index.js"),
};

export default withNextra({
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    root: repositoryRoot,
    resolveAlias: localStagesAliases,
  },
  webpack(config) {
    Object.assign(config.resolve.alias, localStagesAliases);
    return config;
  },
});
