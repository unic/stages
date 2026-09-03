"use client";

import { useState } from "react";
import styles from "./stages-demo.module.css";

export function CopySourceButton({ source }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return <button className={styles.copy} type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>;
}
