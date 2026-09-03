import { cache } from "react";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { codeToHtml } from "shiki";
import { CopySourceButton } from "./CopySourceButton";
import { StagesDemo } from "./StagesDemo";
import styles from "./stages-demo.module.css";

const examples = {
  controlled: { filename: "ControlledProfile.jsx", title: "Controlled profile source", summary: "Shows the controlled handshake, reducer-backed fields, a transform, conditional structure, and reveal policy." },
  collection: { filename: "PeopleCollection.jsx", title: "Collection source", summary: "Uses stable row keys and capability-driven add, remove, and move controls." },
  wizard: { filename: "SignupWizard.jsx", title: "Wizard source", summary: "Combines scoped validation, linear controls, non-linear navigation, and a domain guard." },
  transaction: { filename: "BatchedName.jsx", title: "Transaction source", summary: "Records the single change emitted by two explicitly batched field events." },
  persistence: { filename: "PersistentNote.jsx", title: "Persistence source", summary: "Serializes controlled value, baseline, durable metadata, and a registered extension namespace." },
  asyncValidation: { filename: "UsernameValidation.jsx", title: "Async validation source", summary: "Implements cooperative cancellation so superseded asynchronous work cannot publish." },
  diagnostics: { filename: "SchemaRecovery.jsx", title: "Recovery source", summary: "Demonstrates last-valid-tree behavior when a schema factory fails and later recovers." },
};

const readDemoFile = cache(() => readFile(resolve(process.cwd(), "components/StagesDemo.jsx"), "utf8"));

const readRegion = cache(async (name) => {
  const file = await readDemoFile();
  const start = `// source:start ${name}`;
  const end = `// source:end ${name}`;
  const from = file.indexOf(start);
  const to = file.indexOf(end);
  if (from < 0 || to < 0 || to <= from) throw new Error(`Missing documented source region: ${name}`);
  return file.slice(from + start.length, to).trim();
});

const highlight = cache((source) => codeToHtml(source, {
  lang: "jsx",
  themes: { light: "github-light", dark: "github-dark" },
}));

function SourceFile({ filename, source, html }) {
  return <section className={styles.sourceFile}>
    <header><code>{filename}</code><CopySourceButton source={source} /></header>
    <div className={styles.sourceCode} dangerouslySetInnerHTML={{ __html: html }} />
  </section>;
}

export async function StagesExample({ example = "controlled" }) {
  const metadata = examples[example];
  if (!metadata) return <StagesDemo example={example} />;
  const [source, shared] = await Promise.all([readRegion(example), readRegion("shared")]);
  const [sourceHtml, sharedHtml] = await Promise.all([highlight(source), highlight(shared)]);

  return <div className={styles.example}>
    <StagesDemo example={example} />
    <details className={styles.sourcePanel}>
      <summary>View documented source</summary>
      <div className={styles.sourceIntro}>
        <strong>{metadata.title}</strong>
        <p>{metadata.summary} This is the source executed by the preview above.</p>
      </div>
      <SourceFile filename={metadata.filename} source={source} html={sourceHtml} />
      <details className={styles.sharedSource}>
        <summary>View the shared field adapter</summary>
        <p>All demos use this registry and accessible React field view. Core treats the view as an opaque adapter token.</p>
        <SourceFile filename="demo-fields.jsx" source={shared} html={sharedHtml} />
      </details>
    </details>
  </div>;
}
