import type { DataPath, NodeAddress, NodeConfig } from "@stages/core";
import type { StudioFormDocument, StudioNode, Uid } from "../document";
import { isSafeObjectKey } from "../document";
import {
  STUDIO_RUNTIME_FIELDS,
  studioFieldDefinition,
  validateStudioFieldProps,
} from "../registry";
import { studioRuntimeAddressKey, studioRuntimePathKey } from "./source-map";
import type {
  CompiledStudioForm,
  StudioDiagnostic,
  StudioFieldRegistry,
  StudioRenderNode,
  StudioSourceMapEntry,
} from "./types";

interface CompileContext {
  readonly form: StudioFormDocument;
  readonly diagnostics: StudioDiagnostic[];
  readonly byUid: Map<Uid, StudioSourceMapEntry>;
  readonly uidByPath: Map<string, Uid>;
  readonly uidByAddress: Map<string, Uid>;
  readonly visited: Set<Uid>;
  readonly visiting: Set<Uid>;
}

interface CompiledNode {
  readonly schema: NodeConfig<unknown, StudioFieldRegistry, unknown>;
  readonly render: StudioRenderNode;
}

function diagnostic(
  context: CompileContext,
  code: string,
  message: string,
  details: Omit<StudioDiagnostic, "code" | "message" | "severity" | "source" | "formUid"> = {},
): void {
  context.diagnostics.push({
    code,
    severity: "error",
    source: "compiler",
    message,
    formUid: context.form.uid,
    ...details,
  });
}

function recordSource(
  context: CompileContext,
  uid: Uid,
  runtimePath: DataPath,
  runtimeAddress: NodeAddress,
): void {
  const entry = Object.freeze({ uid, runtimePath, runtimeAddress });
  context.byUid.set(uid, entry);
  context.uidByPath.set(studioRuntimePathKey(runtimePath), uid);
  context.uidByAddress.set(studioRuntimeAddressKey(runtimeAddress), uid);
}

function unsupportedBehavior(
  context: CompileContext,
  node: StudioNode,
  runtimePath: DataPath,
  runtimeAddress: NodeAddress,
): void {
  if (node.behavior?.when !== undefined) diagnostic(
    context,
    "compiler.unsupported-behavior",
    "Conditional visibility is not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "behavior", "when"], runtimePath, runtimeAddress },
  );
  if (node.behavior?.disabled !== undefined && typeof node.behavior.disabled !== "boolean") diagnostic(
    context,
    "compiler.unsupported-behavior",
    "Dynamic disabled state is not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "behavior", "disabled"], runtimePath, runtimeAddress },
  );
  if (node.kind === "field" && node.computed !== undefined) diagnostic(
    context,
    "compiler.unsupported-computed",
    "Computed fields are not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "computed"], runtimePath, runtimeAddress },
  );
  if (node.kind === "field" && node.validators !== undefined && node.validators.length > 0) diagnostic(
    context,
    "compiler.unsupported-validators",
    "Document validators are not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "validators"], runtimePath, runtimeAddress },
  );
}

function compileSiblings(
  context: CompileContext,
  uids: readonly Uid[],
  parentPath: DataPath,
  parentAddress: NodeAddress,
): readonly CompiledNode[] {
  const output: CompiledNode[] = [];
  const siblingIds = new Set<string>();
  for (const uid of uids) {
    const node = context.form.nodes[uid];
    if (!node) {
      diagnostic(context, "compiler.missing-node", `Node reference ${uid} does not resolve.`, {
        entityUid: uid,
        runtimePath: parentPath,
        runtimeAddress: parentAddress,
      });
      continue;
    }
    if (node.kind !== "block" && siblingIds.has(node.runtimeId)) {
      diagnostic(context, "compiler.duplicate-sibling-id", `Sibling runtime ID ${node.runtimeId} is duplicated.`, {
        entityUid: uid,
        propertyPath: ["nodes", uid, "runtimeId"],
        runtimePath: [...parentPath, node.runtimeId],
        runtimeAddress: [...parentAddress, { kind: "node", id: node.runtimeId }],
      });
      continue;
    }
    if (node.kind !== "block") siblingIds.add(node.runtimeId);
    const compiled = compileNode(context, node, parentPath, parentAddress);
    if (compiled) output.push(compiled);
  }
  return output;
}

function compileNode(
  context: CompileContext,
  node: StudioNode,
  parentPath: DataPath,
  parentAddress: NodeAddress,
): CompiledNode | undefined {
  if (context.visiting.has(node.uid)) {
    diagnostic(context, "compiler.node-cycle", `Node graph contains a cycle at ${node.uid}.`, { entityUid: node.uid });
    return undefined;
  }
  if (context.visited.has(node.uid)) {
    diagnostic(context, "compiler.duplicate-node-reference", `Node ${node.uid} is referenced more than once.`, { entityUid: node.uid });
    return undefined;
  }
  context.visited.add(node.uid);
  context.visiting.add(node.uid);

  if (node.kind !== "field" && node.kind !== "group") {
    diagnostic(context, "compiler.unsupported-node-kind", `Node kind ${node.kind} is not supported by the minimal compiler.`, {
      entityUid: node.uid,
      propertyPath: ["nodes", node.uid, "kind"],
    });
    context.visiting.delete(node.uid);
    return undefined;
  }
  if (!isSafeObjectKey(node.runtimeId) || node.runtimeId.length === 0 || node.runtimeId.length > 128) {
    diagnostic(context, "compiler.invalid-runtime-id", `Runtime ID ${JSON.stringify(node.runtimeId)} is invalid.`, {
      entityUid: node.uid,
      propertyPath: ["nodes", node.uid, "runtimeId"],
    });
    context.visiting.delete(node.uid);
    return undefined;
  }

  const runtimePath: DataPath = [...parentPath, node.runtimeId];
  const runtimeAddress: NodeAddress = [...parentAddress, { kind: "node", id: node.runtimeId }];
  recordSource(context, node.uid, runtimePath, runtimeAddress);
  unsupportedBehavior(context, node, runtimePath, runtimeAddress);
  const presentation = node.presentation ?? {};

  if (node.kind === "field") {
    context.visiting.delete(node.uid);
    const definition = studioFieldDefinition(node.definition);
    if (!definition) {
      diagnostic(
        context,
        "compiler.unsupported-field-definition",
        `Field definition ${node.definition.key}@${node.definition.version} is not supported by the minimal compiler.`,
        {
          entityUid: node.uid,
          propertyPath: ["nodes", node.uid, "definition"],
          runtimePath,
          runtimeAddress,
        },
      );
      return undefined;
    }
    for (const issue of validateStudioFieldProps(definition, node.props)) diagnostic(
      context,
      "compiler.invalid-field-prop",
      issue.message,
      {
        entityUid: node.uid,
        propertyPath: ["nodes", node.uid, "props", issue.key],
        runtimePath,
        runtimeAddress,
      },
    );
    return {
      schema: {
        kind: "field",
        id: node.runtimeId,
        type: definition.key,
        props: node.props,
        ...(typeof node.behavior?.disabled === "boolean" ? { disabled: node.behavior.disabled } : {}),
      },
      render: {
        uid: node.uid,
        kind: "field",
        runtimePath,
        runtimeAddress,
        presentation,
        children: [],
      },
    };
  }

  const children = compileSiblings(context, node.childUids, runtimePath, runtimeAddress);
  context.visiting.delete(node.uid);
  return {
    schema: {
      kind: "group",
      id: node.runtimeId,
      nodes: children.map((child) => child.schema),
      ...(typeof node.behavior?.disabled === "boolean" ? { disabled: node.behavior.disabled } : {}),
    },
    render: {
      uid: node.uid,
      kind: "group",
      runtimePath,
      runtimeAddress,
      presentation,
      children: children.map((child) => child.render),
    },
  };
}

export function compileStudioForm(form: StudioFormDocument): CompiledStudioForm {
  const context: CompileContext = {
    form,
    diagnostics: [],
    byUid: new Map(),
    uidByPath: new Map(),
    uidByAddress: new Map(),
    visited: new Set(),
    visiting: new Set(),
  };
  const nodes = compileSiblings(context, form.rootNodeUids, [], []);
  for (const uid of Object.keys(form.nodes) as Uid[]) {
    if (!context.visited.has(uid)) diagnostic(
      context,
      "compiler.unreachable-node",
      `Node ${uid} is not reachable from a form root.`,
      { entityUid: uid, propertyPath: ["nodes", uid] },
    );
  }
  return {
    schema: {
      id: form.runtime.schemaId,
      version: form.runtime.schemaVersion,
      nodes: nodes.map((node) => node.schema),
    },
    fields: STUDIO_RUNTIME_FIELDS,
    renderPlan: { formUid: form.uid, nodes: nodes.map((node) => node.render) },
    sourceMap: {
      byUid: context.byUid,
      uidByPath: context.uidByPath,
      uidByAddress: context.uidByAddress,
    },
    diagnostics: context.diagnostics,
  };
}
