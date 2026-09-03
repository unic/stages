import {
  assertSafePath,
  isSafePathSegment,
  setAtPath,
  stages,
  type DataPath,
  type Diagnostic,
  type FieldDefinition,
  type NodeAddress,
  type StagesController,
  type StagesSchemaFactory,
} from "@stages/core";

interface NumberProps {
  readonly label: string;
}

const number = {
  view: "number",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number, NumberProps, "number">;

const fields = { number } as const;

interface DiagnosticValue {
  count: number;
  failSchema: boolean;
}

const stableSchema = {
  id: "diagnostic-example",
  version: 1,
  nodes: [{
    kind: "field",
    id: "count",
    type: "number",
    props: { label: "Count" },
  }],
} as const;

export interface DiagnosticRecord {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly path: DataPath;
  readonly address: NodeAddress;
}

function diagnosticRecord(diagnostic: Diagnostic): DiagnosticRecord {
  // Messages can include errors thrown by application callbacks, so this
  // telemetry record deliberately keeps only structural identifiers.
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    path: diagnostic.path,
    address: diagnostic.address,
  };
}

// source:start diagnostic-observation
export function observeDiagnostics(
  send: (channel: "callback" | "snapshot", items: readonly DiagnosticRecord[]) => void,
) {
  const controller = stages({
    schema: stableSchema,
    fields,
    value: { count: 0, failSchema: false },
    onDiagnostic(diagnostic) {
      // Immediate occurrences are useful for logs and counters.
      send("callback", [diagnosticRecord(diagnostic)]);
    },
  });

  const unsubscribe = controller.subscribeSelector(
    snapshot => snapshot.diagnostics,
    diagnostics => {
      // Snapshot state is useful for an inspector or schema editor.
      send("snapshot", diagnostics.map(diagnosticRecord));
    },
  );

  return {
    controller,
    destroy() {
      unsubscribe();
      controller.destroy();
    },
  };
}
// source:end diagnostic-observation

const recoveringSchema: StagesSchemaFactory<DiagnosticValue, typeof fields> = ({ value }) => {
  if (value.failSchema) throw new Error("schema service unavailable");
  return {
    id: "recovering-schema",
    version: 1,
    nodes: [{
      kind: "field",
      id: "count",
      type: "number",
      props: { label: `Count ${value.count}` },
    }],
  };
};

// source:start last-valid-recovery
export function demonstrateLastValidRecovery(
  reported: Diagnostic[],
) {
  const controller = stages({
    schema: recoveringSchema,
    fields,
    value: { count: 1, failSchema: false },
    onDiagnostic: diagnostic => reported.push(diagnostic),
  });

  controller.update({ value: { count: 2, failSchema: true } });
  const failedRevision = controller.getSnapshot();
  // The last valid field/config remains, but it reads canonical count 2.

  controller.update({ value: { count: 3, failSchema: false } });
  const recoveredRevision = controller.getSnapshot();
  // A valid revision replaces the fallback tree and clears schema diagnostics.

  return { controller, failedRevision, recoveredRevision };
}
// source:end last-valid-recovery

// source:start safe-path-boundary
export function updateNameSafely<TValue>(
  value: TValue,
  path: DataPath,
  name: string,
): TValue {
  assertSafePath(path);
  return setAtPath(value, path, name);
}

export function prototypePollutionIsRejected(): boolean {
  const hostilePath = ["profile", "__proto__", "polluted"] as const;
  if (isSafePathSegment(hostilePath[1])) return false;

  try {
    setAtPath({}, hostilePath, true);
  } catch (error) {
    return error instanceof TypeError;
  }
  return false;
}
// source:end safe-path-boundary

// source:start diagnostic-troubleshooting
export function diagnosticLocation(diagnostic: Diagnostic) {
  return {
    code: diagnostic.code,
    dataPath: diagnostic.path.length === 0
      ? "<root>"
      : diagnostic.path.map(String).join("."),
    nodeAddress: diagnostic.address.length === 0
      ? "<root>"
      : diagnostic.address
        .map(segment => `${segment.kind}:${segment.id}`)
        .join(" / "),
  };
}

export function provokeMissingTarget(
  controller: StagesController<DiagnosticValue, typeof fields>,
) {
  controller.dispatch({
    name: "input",
    target: { kind: "field", path: ["removed-field"] },
    payload: 1,
  });
}
// source:end diagnostic-troubleshooting
