import { cache } from "react";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { codeToHtml } from "shiki";
import { CopySourceButton } from "./CopySourceButton";
import styles from "./stages-demo.module.css";

const fixturePattern = /^docs\/examples\/[a-z0-9.-]+\.(?:ts|tsx)$/;
const regionPattern = /^[a-z0-9-]+$/;

const readFixture = cache(async (fixture) => {
  if (!fixturePattern.test(fixture)) throw new Error(`Unsupported checked fixture: ${fixture}`);
  return readFile(resolve(process.cwd(), "..", fixture), "utf8");
});

const readRegion = cache(async (fixture, region) => {
  if (!regionPattern.test(region)) throw new Error(`Unsupported checked region: ${region}`);
  const source = await readFixture(fixture);
  const start = `// source:start ${region}`;
  const end = `// source:end ${region}`;
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from < 0 || to < 0 || to <= from) {
    throw new Error(`Missing checked source region ${region} in ${fixture}`);
  }
  return source.slice(from + start.length, to).trim();
});

export async function CheckedSource({ fixture, region, filename }) {
  const source = await readRegion(fixture, region);
  const language = fixture.endsWith(".tsx") ? "tsx" : "ts";
  const html = await codeToHtml(source, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
  });

  return <div className={styles.example}>
    <section className={styles.sourceFile}>
      <header>
        <code>{filename ?? basename(fixture)}</code>
        <CopySourceButton source={source} />
      </header>
      <div className={styles.sourceCode} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  </div>;
}
