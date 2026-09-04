import type {
  DiagnosticPath,
  StudioDocumentDiagnostic,
  StudioDocumentLimits,
  StudioDocumentResult,
  StudioDocumentValidationOptions,
  StudioProjectDocument,
  Uid,
} from "./types";
import { isSafeObjectKey, isUid } from "./uid";
import { isStudioExpression } from "../expressions/validation";

export const DEFAULT_STUDIO_DOCUMENT_LIMITS: StudioDocumentLimits = Object.freeze({
  maxBytes: 5 * 1024 * 1024,
  maxForms: 50,
  maxNodesPerForm: 1_000,
  maxNodesPerProject: 10_000,
  maxScenariosPerForm: 50,
  maxFragments: 100,
  maxNodesPerFragment: 1_000,
  maxDepth: 50,
  maxJsonDepth: 100,
});

const MAX_DIAGNOSTICS = 100;

function issue(
  code: string,
  message: string,
  propertyPath: DiagnosticPath,
  details: { readonly formUid?: Uid; readonly entityUid?: Uid } = {},
): StudioDocumentDiagnostic {
  return { code, severity: "error", source: "document", message, propertyPath, ...details };
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototypeValue = Object.getPrototypeOf(value) as object | null;
  return prototypeValue === Object.prototype || prototypeValue === null;
}

function own(value: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined;
}

function isValidationPath(value: unknown): boolean {
  return Array.isArray(value) && value.every((segment) => typeof segment === "string"
    ? isSafeObjectKey(segment)
    : Number.isSafeInteger(segment) && (segment as number) >= 0);
}

function validEventPolicy(value: unknown): boolean {
  return typeof value === "string" ? value.length > 0
    : Array.isArray(value) && value.length > 0 && value.every((event) => typeof event === "string" && event.length > 0);
}

function validateValidators(
  value: unknown,
  path: DiagnosticPath,
  failures: StudioDocumentDiagnostic[],
  details: { readonly formUid?: Uid; readonly entityUid?: Uid },
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) { failures.push(issue("document.invalid-validators", "validators must be an array.", path, details)); return; }
  const ids = new Set<string>();
  value.forEach((candidate, index) => {
    const validatorPath = [...path, index];
    if (!isPlainRecord(candidate)) { failures.push(issue("document.invalid-validator", "Validator must be an object.", validatorPath, details)); return; }
    const kind = own(candidate, "kind");
    if (!["required", "length", "range", "pattern", "comparison", "collection"].includes(String(kind))) failures.push(issue("document.invalid-validator-kind", "Validator kind is not in the synchronous catalog.", [...validatorPath, "kind"], details));
    const id = own(candidate, "id");
    if (id !== undefined && (typeof id !== "string" || id.trim().length === 0)) failures.push(issue("document.invalid-validator-id", "Validator id must be a non-empty string.", [...validatorPath, "id"], details));
    else if (typeof id === "string" && ids.has(id)) failures.push(issue("document.duplicate-validator-id", `Validator ID ${id} is duplicated.`, [...validatorPath, "id"], details));
    else if (typeof id === "string") ids.add(id);
    for (const key of ["on", "revealOn"] as const) {
      const policy = own(candidate, key);
      if (policy !== undefined && !validEventPolicy(policy)) failures.push(issue("document.invalid-validator-events", `${key} must be a non-empty event or event array.`, [...validatorPath, key], details));
    }
    const severity = own(candidate, "severity");
    if (severity !== undefined && severity !== "error" && severity !== "warning") failures.push(issue("document.invalid-validator-severity", "severity must be error or warning.", [...validatorPath, "severity"], details));
    const message = own(candidate, "message");
    if (message !== undefined && typeof message !== "string" && (!isPlainRecord(message)
      || typeof own(message, "default") !== "string"
      || (own(message, "translations") !== undefined && (!isPlainRecord(own(message, "translations")) || Object.values(own(message, "translations") as Record<string, unknown>).some((translation) => typeof translation !== "string"))))) {
      failures.push(issue("document.invalid-validator-message", "message must be text or a localized message object.", [...validatorPath, "message"], details));
    }
    if (own(candidate, "when") !== undefined && !isStudioExpression(own(candidate, "when"))) failures.push(issue("document.invalid-expression", "Validator when must be a safe expression AST.", [...validatorPath, "when"], details));
    if (own(candidate, "includeDisabled") !== undefined && typeof own(candidate, "includeDisabled") !== "boolean") failures.push(issue("document.invalid-validator-disabled-policy", "includeDisabled must be boolean.", [...validatorPath, "includeDisabled"], details));
    const dependencies = own(candidate, "dependencies");
    if (dependencies !== undefined && (!Array.isArray(dependencies) || dependencies.some((dependency) => !isValidationPath(dependency)))) failures.push(issue("document.invalid-validator-dependencies", "dependencies must contain safe absolute data paths.", [...validatorPath, "dependencies"], details));
    if (own(candidate, "issuePath") !== undefined && !isValidationPath(own(candidate, "issuePath"))) failures.push(issue("document.invalid-validator-issue-path", "issuePath must be a safe absolute data path.", [...validatorPath, "issuePath"], details));
    for (const key of ["min", "max"] as const) {
      const bound = own(candidate, key);
      if (bound !== undefined && (typeof bound !== "number" || !Number.isFinite(bound) || ((kind === "length" || kind === "collection") && (!Number.isSafeInteger(bound) || bound < 0)))) failures.push(issue("document.invalid-validator-bound", `${key} is not a valid ${kind} bound.`, [...validatorPath, key], details));
    }
    if (typeof own(candidate, "min") === "number" && typeof own(candidate, "max") === "number" && (own(candidate, "min") as number) > (own(candidate, "max") as number)) failures.push(issue("document.invalid-validator-range", "Validator min cannot exceed max.", validatorPath, details));
    if (kind === "pattern" && typeof own(candidate, "pattern") !== "string") failures.push(issue("document.invalid-validator-pattern", "Pattern validator requires a string pattern.", [...validatorPath, "pattern"], details));
    if (kind === "pattern" && typeof own(candidate, "pattern") === "string") try { new RegExp(own(candidate, "pattern") as string, typeof own(candidate, "flags") === "string" ? own(candidate, "flags") as string : undefined); } catch { failures.push(issue("document.invalid-validator-pattern", "Pattern validator regular expression is invalid.", [...validatorPath, "pattern"], details)); }
    if (kind === "comparison" && (!["===", "!==", "<", "<=", ">", ">="].includes(String(own(candidate, "operator"))) || !isStudioExpression(own(candidate, "other")))) failures.push(issue("document.invalid-validator-comparison", "Comparison validator requires an operator and safe expression.", validatorPath, details));
    const uniqueBy = own(candidate, "uniqueBy");
    if (kind === "collection" && uniqueBy !== undefined && (!Array.isArray(uniqueBy) || uniqueBy.some((segment) => typeof segment !== "string" || !isSafeObjectKey(segment)))) failures.push(issue("document.invalid-validator-unique-path", "uniqueBy must be a safe relative property path.", [...validatorPath, "uniqueBy"], details));
  });
}

export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
}

export function inspectJsonSafety(
  value: unknown,
  maxBytes: number,
  maxDepth = DEFAULT_STUDIO_DOCUMENT_LIMITS.maxJsonDepth,
): StudioDocumentDiagnostic[] {
  const failures: StudioDocumentDiagnostic[] = [];
  const ancestors = new WeakSet<object>();
  const stack: Array<{ value: unknown; path: (number | string)[]; depth: number; leaving?: boolean }> = [
    { value, path: [], depth: 0 },
  ];
  let estimatedBytes = 0;
  while (stack.length > 0 && failures.length < MAX_DIAGNOSTICS) {
    const item = stack.pop();
    if (!item) break;
    const current = item.value;
    if (item.leaving) {
      if (current !== null && typeof current === "object") ancestors.delete(current);
      continue;
    }
    if (current === null) { estimatedBytes += 4; continue; }
    if (typeof current === "boolean") { estimatedBytes += current ? 4 : 5; continue; }
    if (typeof current === "string") {
      estimatedBytes += utf8ByteLength(JSON.stringify(current));
      continue;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) failures.push(issue("document.non-finite-number", "Numbers must be finite.", item.path));
      estimatedBytes += String(current).length;
      continue;
    }
    if (typeof current !== "object") {
      failures.push(issue("document.non-json-value", "The value is not JSON-safe.", item.path));
      continue;
    }
    if (!Array.isArray(current) && !isPlainRecord(current)) {
      failures.push(issue("document.non-plain-object", "Objects must have a plain or null prototype.", item.path));
      continue;
    }
    if (ancestors.has(current)) {
      failures.push(issue("document.object-cycle", "JSON values cannot contain object cycles.", item.path));
      continue;
    }
    ancestors.add(current);
    if (item.depth > maxDepth) {
      failures.push(issue("document.json-depth-limit", `JSON nesting exceeds maximum depth ${maxDepth}.`, item.path));
      ancestors.delete(current);
      continue;
    }
    stack.push({ value: current, path: item.path, depth: item.depth, leaving: true });
    const entries: ReadonlyArray<readonly [number | string, unknown]> = Array.isArray(current)
      ? current.map((child, index) => [index, child] as const)
      : Object.entries(current);
    estimatedBytes += 2 + Math.max(0, entries.length - 1);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (!entry) continue;
      const [key, child] = entry;
      if (typeof key === "string") {
        estimatedBytes += utf8ByteLength(JSON.stringify(key)) + 1;
        if (!isSafeObjectKey(key)) failures.push(issue(
          "document.unsafe-key",
          `Unsafe object key ${JSON.stringify(key)} is not allowed.`,
          [...item.path, key],
        ));
      }
      stack.push({ value: child, path: [...item.path, key], depth: item.depth + 1 });
    }
  }
  if (estimatedBytes > maxBytes) failures.push(issue(
    "document.size-limit",
    `Decoded project exceeds the ${maxBytes}-byte defensive limit.`,
    [],
  ));
  return failures;
}

function freezeClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  const clone: Record<string, unknown> | unknown[] = Array.isArray(value) ? [] : {};
  const queue: Array<{
    source: Record<string, unknown> | readonly unknown[];
    target: Record<string, unknown> | unknown[];
  }> = [{ source: value as Record<string, unknown> | readonly unknown[], target: clone }];
  const created: object[] = [clone];
  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    if (!item) continue;
    for (const [key, child] of Object.entries(item.source)) {
      if (child !== null && typeof child === "object") {
        const childClone: Record<string, unknown> | unknown[] = Array.isArray(child) ? [] : {};
        item.target[key as keyof typeof item.target] = childClone as never;
        created.push(childClone);
        queue.push({ source: child as Record<string, unknown> | readonly unknown[], target: childClone });
      } else {
        item.target[key as keyof typeof item.target] = child as never;
      }
    }
  }
  for (let index = created.length - 1; index >= 0; index -= 1) Object.freeze(created[index]);
  return clone as T;
}

function recordUid(
  failures: StudioDocumentDiagnostic[],
  seen: Map<string, DiagnosticPath>,
  value: unknown,
  path: DiagnosticPath,
): value is Uid {
  if (!isUid(value)) {
    failures.push(issue("document.invalid-uid", "Expected a safe Studio UID.", path));
    return false;
  }
  const prior = seen.get(value);
  if (prior) {
    failures.push(issue("document.duplicate-uid", `UID ${value} is already used at ${JSON.stringify(prior)}.`, path, { entityUid: value }));
    return false;
  }
  seen.set(value, path);
  return true;
}

function checkGraph(
  formValue: Record<string, unknown>,
  formUid: Uid,
  formPath: DiagnosticPath,
  maxDepth: number,
  failures: StudioDocumentDiagnostic[],
): void {
  const nodes = own(formValue, "nodes");
  const roots = own(formValue, "rootNodeUids");
  if (!isPlainRecord(nodes) || !Array.isArray(roots)) return;
  const parents = new Set<string>();
  const state = new Map<string, 0 | 1 | 2>();
  const stack: Array<{ uid: string; depth: number; leaving?: boolean; path: DiagnosticPath }> = [];
  roots.forEach((root, index) => {
    const path = [...formPath, "rootNodeUids", index];
    if (!isUid(root) || !Object.prototype.hasOwnProperty.call(nodes, root)) {
      failures.push(issue("document.missing-node-reference", `Root reference ${JSON.stringify(root)} does not resolve.`, path, { formUid }));
    } else if (parents.has(root)) {
      failures.push(issue("document.duplicate-node-reference", `Node ${root} is referenced more than once.`, path, { formUid, entityUid: root }));
    } else {
      const rootNode = nodes[root];
      const rootKind = isPlainRecord(rootNode) ? own(rootNode, "kind") : undefined;
      if (rootKind === "stage" || rootKind === "variant") failures.push(issue(
        "document.invalid-node-placement",
        `${String(rootKind)} nodes cannot be form roots.`,
        path,
        { formUid, entityUid: root },
      ));
      parents.add(root);
      stack.push({ uid: root, depth: 1, path });
    }
  });
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) break;
    if (item.leaving) { state.set(item.uid, 2); continue; }
    if (state.get(item.uid) === 1) {
      failures.push(issue("document.node-cycle", `Node graph contains a cycle at ${item.uid}.`, item.path, { formUid, entityUid: item.uid as Uid }));
      continue;
    }
    if (state.get(item.uid) === 2) continue;
    state.set(item.uid, 1);
    stack.push({ ...item, leaving: true });
    if (item.depth > maxDepth) {
      failures.push(issue("document.depth-limit", `Node graph exceeds maximum depth ${maxDepth}.`, item.path, { formUid, entityUid: item.uid as Uid }));
      continue;
    }
    const node = nodes[item.uid];
    if (!isPlainRecord(node)) continue;
    const kind = own(node, "kind");
    const referenceKey = kind === "wizard" ? "stageUids"
      : kind === "collection" && Object.prototype.hasOwnProperty.call(node, "variantUids") ? "variantUids"
        : "childUids";
    const references = own(node, referenceKey);
    if (!Array.isArray(references)) continue;
    references.forEach((child, index) => {
      const path = [...formPath, "nodes", item.uid, referenceKey, index];
      if (!isUid(child) || !Object.prototype.hasOwnProperty.call(nodes, child)) {
        failures.push(issue("document.missing-node-reference", `Child reference ${JSON.stringify(child)} does not resolve.`, path, { formUid, entityUid: item.uid as Uid }));
      } else if (state.get(child) === 1) {
        failures.push(issue("document.node-cycle", `Node graph contains a cycle at ${child}.`, path, { formUid, entityUid: child }));
      } else if (parents.has(child)) {
        failures.push(issue("document.duplicate-node-reference", `Node ${child} is referenced more than once.`, path, { formUid, entityUid: child }));
      } else {
        const childNode = nodes[child];
        const childKind = isPlainRecord(childNode) ? own(childNode, "kind") : undefined;
        const validPlacement = kind === "wizard" ? childKind === "stage"
          : referenceKey === "variantUids" ? childKind === "variant"
            : childKind !== "stage" && childKind !== "variant";
        if (!validPlacement) {
          failures.push(issue(
            "document.invalid-node-placement",
            `Node kind ${String(childKind)} cannot be referenced by ${String(kind)}.${referenceKey}.`,
            path,
            { formUid, entityUid: child },
          ));
        }
        parents.add(child);
        stack.push({ uid: child, depth: item.depth + 1, path });
      }
    });
  }
  for (const key of Object.keys(nodes)) {
    if (!parents.has(key)) failures.push(issue(
      "document.unreachable-node",
      `Node ${key} is not reachable from a form root.`,
      [...formPath, "nodes", key],
      { formUid, ...(isUid(key) ? { entityUid: key } : {}) },
    ));
  }
}

export function validateStudioProject(
  input: unknown,
  options: StudioDocumentValidationOptions = {},
): StudioDocumentResult {
  const limits = { ...DEFAULT_STUDIO_DOCUMENT_LIMITS, ...options.limits };
  const failures = inspectJsonSafety(input, limits.maxBytes, limits.maxJsonDepth);
  if (!isPlainRecord(input)) {
    if (failures.length === 0) failures.push(issue("document.invalid-root", "Project must be a JSON object.", []));
    return { ok: false, diagnostics: failures };
  }
  if (failures.length > 0) return { ok: false, diagnostics: failures };
  if (own(input, "format") !== "stages-studio") failures.push(issue("document.invalid-format", "format must be stages-studio.", ["format"]));
  if (own(input, "formatVersion") !== 1) failures.push(issue("document.unsupported-format-version", "formatVersion must be 1 after migration.", ["formatVersion"]));
  const projectValue = own(input, "project");
  const formsValue = own(input, "forms");
  if (!isPlainRecord(projectValue)) failures.push(issue("document.invalid-project", "project must be an object.", ["project"]));
  if (!isPlainRecord(formsValue)) failures.push(issue("document.invalid-forms", "forms must be a UID-keyed object.", ["forms"]));
  const fragments = own(input, "fragments");
  if (!isPlainRecord(fragments)) failures.push(issue("document.invalid-fragments", "fragments must be a UID-keyed object.", ["fragments"]));
  if (!isPlainRecord(own(input, "resources"))) failures.push(issue("document.invalid-resources", "resources must be a JSON object.", ["resources"]));

  const uids = new Map<string, DiagnosticPath>();
  if (isPlainRecord(projectValue)) {
    recordUid(failures, uids, own(projectValue, "uid"), ["project", "uid"]);
    if (typeof own(projectValue, "title") !== "string") failures.push(issue("document.invalid-title", "Project title must be a string.", ["project", "title"]));
    if (typeof own(projectValue, "defaultLocale") !== "string" || (own(projectValue, "defaultLocale") as string).length === 0) failures.push(issue("document.invalid-locale", "defaultLocale must be a non-empty string.", ["project", "defaultLocale"]));
  }
  let totalNodes = 0;
  if (isPlainRecord(formsValue)) {
    const formEntries = Object.entries(formsValue);
    if (formEntries.length > limits.maxForms) failures.push(issue("document.form-limit", `Project exceeds the ${limits.maxForms}-form limit.`, ["forms"]));
    for (const [formKey, formUnknown] of formEntries) {
      const formPath: DiagnosticPath = ["forms", formKey];
      if (!isPlainRecord(formUnknown)) { failures.push(issue("document.invalid-form", "Form must be an object.", formPath)); continue; }
      const formUidValue = own(formUnknown, "uid");
      if (!recordUid(failures, uids, formUidValue, [...formPath, "uid"])) continue;
      const formUid = formUidValue;
      if (formKey !== formUid) failures.push(issue("document.uid-key-mismatch", `Form key ${formKey} does not match uid ${formUid}.`, formPath, { formUid, entityUid: formUid }));
      if (typeof own(formUnknown, "title") !== "string") failures.push(issue("document.invalid-title", "Form title must be a string.", [...formPath, "title"], { formUid }));
      validateValidators(own(formUnknown, "validators"), [...formPath, "validators"], failures, { formUid, entityUid: formUid });
      const runtime = own(formUnknown, "runtime");
      if (!isPlainRecord(runtime) || typeof own(runtime, "schemaId") !== "string" || !Number.isSafeInteger(own(runtime, "schemaVersion")) || (own(runtime, "schemaVersion") as number) < 1) {
        failures.push(issue("document.invalid-runtime", "runtime requires schemaId and a positive integer schemaVersion.", [...formPath, "runtime"], { formUid }));
      }
      const nodes = own(formUnknown, "nodes");
      if (!isPlainRecord(nodes)) failures.push(issue("document.invalid-nodes", "nodes must be a UID-keyed object.", [...formPath, "nodes"], { formUid }));
      else {
        const nodeEntries = Object.entries(nodes);
        totalNodes += nodeEntries.length;
        if (nodeEntries.length > limits.maxNodesPerForm) failures.push(issue("document.form-node-limit", `Form exceeds the ${limits.maxNodesPerForm}-node limit.`, [...formPath, "nodes"], { formUid }));
        for (const [nodeKey, node] of nodeEntries) {
          const nodePath = [...formPath, "nodes", nodeKey];
          if (!isPlainRecord(node)) { failures.push(issue("document.invalid-node", "Node must be an object.", nodePath, { formUid })); continue; }
          const nodeUidValue = own(node, "uid");
          if (recordUid(failures, uids, nodeUidValue, [...nodePath, "uid"]) && nodeKey !== nodeUidValue) failures.push(issue("document.uid-key-mismatch", `Node key ${nodeKey} does not match uid ${nodeUidValue}.`, nodePath, { formUid, entityUid: nodeUidValue }));
          const details = isUid(nodeUidValue) ? { formUid, entityUid: nodeUidValue } : { formUid };
          const kind = own(node, "kind");
          const runtimeId = own(node, "runtimeId");
          if (kind !== "block" && (typeof runtimeId !== "string" || runtimeId.length === 0 || runtimeId.length > 128 || !isSafeObjectKey(runtimeId))) failures.push(issue("document.invalid-runtime-id", "runtimeId must be a non-empty safe key of at most 128 characters.", [...nodePath, "runtimeId"], details));
          if (Object.prototype.hasOwnProperty.call(node, "presentation") && !isPlainRecord(own(node, "presentation"))) failures.push(issue("document.invalid-presentation", "presentation must be a JSON object.", [...nodePath, "presentation"], details));
          const behavior = own(node, "behavior");
          if (Object.prototype.hasOwnProperty.call(node, "behavior") && !isPlainRecord(behavior)) failures.push(issue("document.invalid-behavior", "behavior must be a JSON object.", [...nodePath, "behavior"], details));
          else if (isPlainRecord(behavior)) {
            if (Object.prototype.hasOwnProperty.call(behavior, "when") && !isStudioExpression(own(behavior, "when"))) failures.push(issue("document.invalid-expression", "behavior.when must be a safe expression AST.", [...nodePath, "behavior", "when"], details));
            if (Object.prototype.hasOwnProperty.call(behavior, "disabled") && typeof own(behavior, "disabled") !== "boolean" && !isStudioExpression(own(behavior, "disabled"))) failures.push(issue("document.invalid-expression", "behavior.disabled must be a boolean or safe expression AST.", [...nodePath, "behavior", "disabled"], details));
            if (Object.prototype.hasOwnProperty.call(behavior, "presentWhen") && !isStudioExpression(own(behavior, "presentWhen"))) failures.push(issue("document.invalid-expression", "behavior.presentWhen must be a safe expression AST.", [...nodePath, "behavior", "presentWhen"], details));
          }
          if (Object.prototype.hasOwnProperty.call(node, "legacy") && !isPlainRecord(own(node, "legacy"))) failures.push(issue("document.invalid-legacy-metadata", "legacy must be a JSON object.", [...nodePath, "legacy"], details));
          if (kind === "field" || kind === "group" || kind === "collection" || kind === "wizard" || kind === "fragment") validateValidators(own(node, "validators"), [...nodePath, "validators"], failures, details);
          else if (Object.prototype.hasOwnProperty.call(node, "validators")) failures.push(issue("document.invalid-validator-owner", `${String(kind)} nodes cannot own validators.`, [...nodePath, "validators"], details));
          if (kind === "group" || kind === "collection" || kind === "stage") {
            const discriminated = kind === "collection" && Object.prototype.hasOwnProperty.call(node, "variantUids");
            const childKey = discriminated ? "variantUids" : "childUids";
            if (!Array.isArray(own(node, childKey))) failures.push(issue("document.invalid-children", `${kind} ${childKey} must be an array.`, [...nodePath, childKey], details));
            if (kind === "collection") {
              for (const key of ["min", "max", "initialRows"] as const) {
                const value = own(node, key);
                if (value !== undefined && (!Number.isSafeInteger(value) || (value as number) < 0)) failures.push(issue("document.invalid-collection-limit", `${key} must be a non-negative integer.`, [...nodePath, key], details));
              }
              const min = own(node, "min");
              const max = own(node, "max");
              const initialRows = own(node, "initialRows");
              if (typeof min === "number" && typeof max === "number" && min > max) failures.push(issue("document.invalid-collection-range", "Collection min cannot exceed max.", nodePath, details));
              if (typeof initialRows === "number" && typeof max === "number" && initialRows > max) failures.push(issue("document.invalid-initial-rows", "initialRows cannot exceed the collection max.", [...nodePath, "initialRows"], details));
              const discriminator = own(node, "discriminator");
              if (discriminated) {
                const variantUids = own(node, "variantUids");
                if (typeof discriminator !== "string" || discriminator.length === 0 || !isSafeObjectKey(discriminator)) failures.push(issue("document.invalid-discriminator", "A discriminated collection requires a safe discriminator.", [...nodePath, "discriminator"], details));
                if (Array.isArray(variantUids) && variantUids.length === 0) failures.push(issue("document.empty-variants", "A discriminated collection requires at least one variant.", [...nodePath, "variantUids"], details));
                const initialVariantUid = own(node, "initialVariantUid");
                if (initialVariantUid !== undefined && (!isUid(initialVariantUid) || !new Set(Array.isArray(variantUids) ? variantUids : []).has(initialVariantUid))) failures.push(issue("document.invalid-initial-variant", "initialVariantUid must reference one of the collection variants.", [...nodePath, "initialVariantUid"], details));
                if (typeof initialRows === "number" && initialRows > 0 && initialVariantUid === undefined) failures.push(issue("document.missing-initial-variant", "Discriminated collections with initial rows require initialVariantUid.", [...nodePath, "initialVariantUid"], details));
                if (Object.prototype.hasOwnProperty.call(node, "childUids")) failures.push(issue("document.invalid-collection-shape", "A collection cannot define both childUids and variantUids.", nodePath, details));
              } else if (discriminator !== undefined) failures.push(issue("document.invalid-collection-shape", "A homogeneous collection cannot define a discriminator.", [...nodePath, "discriminator"], details));
              const itemKey = own(node, "itemKey");
              if (itemKey !== undefined && (!isPlainRecord(itemKey)
                || (own(itemKey, "kind") !== "index" && (own(itemKey, "kind") !== "property"
                  || typeof own(itemKey, "property") !== "string" || !isSafeObjectKey(own(itemKey, "property") as string))))) {
                failures.push(issue("document.invalid-item-key", "itemKey must use the index or a safe row property.", [...nodePath, "itemKey"], details));
              }
            }
          } else if (kind === "wizard") {
            const stageUids = own(node, "stageUids");
            if (!Array.isArray(stageUids)) failures.push(issue("document.invalid-stages", "Wizard stageUids must be an array.", [...nodePath, "stageUids"], details));
            const initialStageUid = own(node, "initialStageUid");
            if (initialStageUid !== undefined && (!isUid(initialStageUid) || !new Set(Array.isArray(stageUids) ? stageUids : []).has(initialStageUid))) failures.push(issue("document.invalid-initial-stage", "initialStageUid must reference one of the wizard stages.", [...nodePath, "initialStageUid"], details));
            const navigation = own(node, "navigation");
            if (navigation !== undefined && (!isPlainRecord(navigation)
              || (own(navigation, "validateCurrent") !== undefined && typeof own(navigation, "validateCurrent") !== "boolean")
              || (own(navigation, "nonLinear") !== undefined && typeof own(navigation, "nonLinear") !== "boolean"))) failures.push(issue("document.invalid-navigation", "navigation flags must be booleans.", [...nodePath, "navigation"], details));
          } else if (kind === "variant") {
            if (!Array.isArray(own(node, "childUids"))) failures.push(issue("document.invalid-children", "variant childUids must be an array.", [...nodePath, "childUids"], details));
          } else if (kind === "fragment") {
            const fragmentUid = own(node, "fragmentUid");
            if (!isUid(fragmentUid)) failures.push(issue("document.invalid-fragment-reference", "fragmentUid must be a safe Studio UID.", [...nodePath, "fragmentUid"], details));
            const overrides = own(node, "overrides");
            if (overrides !== undefined && !isPlainRecord(overrides)) failures.push(issue("document.invalid-fragment-overrides", "Fragment overrides must be a UID-keyed object.", [...nodePath, "overrides"], details));
          } else if (kind === "field" || kind === "block") {
            const definition = own(node, "definition");
            if (!isPlainRecord(definition) || typeof own(definition, "key") !== "string" || !Number.isSafeInteger(own(definition, "version")) || (own(definition, "version") as number) < 1) {
              failures.push(issue("document.invalid-definition", `${kind} definition requires a key and positive integer version.`, [...nodePath, "definition"], details));
            } else {
              const key = own(definition, "key") as string;
              const version = own(definition, "version") as number;
              if (!options.supportedDefinitions?.[key]?.includes(version)) failures.push(issue("document.unsupported-definition-version", `Required definition ${key}@${version} is not supported.`, [...nodePath, "definition", "version"], details));
            }
            if (!isPlainRecord(own(node, "props"))) failures.push(issue("document.invalid-props", `${kind} props must be a JSON object.`, [...nodePath, "props"], details));
            if (kind === "field") {
              if (Object.prototype.hasOwnProperty.call(node, "computed") && !isStudioExpression(own(node, "computed"))) failures.push(issue("document.invalid-expression", "computed must be a safe expression AST.", [...nodePath, "computed"], details));
              const derivedProps = own(node, "derivedProps");
              if (derivedProps !== undefined && !isPlainRecord(derivedProps)) failures.push(issue("document.invalid-derived-props", "derivedProps must be an expression map.", [...nodePath, "derivedProps"], details));
              else if (isPlainRecord(derivedProps)) for (const [key, expression] of Object.entries(derivedProps)) {
                if (!isSafeObjectKey(key) || !isStudioExpression(expression)) failures.push(issue("document.invalid-expression", `derivedProps.${key} must be a safe expression AST.`, [...nodePath, "derivedProps", key], details));
              }
            }
          } else failures.push(issue("document.unknown-node-kind", "Unknown node kind.", [...nodePath, "kind"], details));
        }
      }
      const scenarios = own(formUnknown, "scenarios");
      if (!Array.isArray(scenarios)) failures.push(issue("document.invalid-scenarios", "scenarios must be an array.", [...formPath, "scenarios"], { formUid }));
      else {
        if (scenarios.length > limits.maxScenariosPerForm) failures.push(issue("document.scenario-limit", `Form exceeds the ${limits.maxScenariosPerForm}-scenario limit.`, [...formPath, "scenarios"], { formUid }));
        scenarios.forEach((scenario, index) => {
          const scenarioPath = [...formPath, "scenarios", index];
          if (!isPlainRecord(scenario)) { failures.push(issue("document.invalid-scenario", "Scenario must be an object.", scenarioPath, { formUid })); return; }
          recordUid(failures, uids, own(scenario, "uid"), [...scenarioPath, "uid"]);
          if (typeof own(scenario, "title") !== "string") failures.push(issue("document.invalid-title", "Scenario title must be a string.", [...scenarioPath, "title"], { formUid }));
          if (!Object.prototype.hasOwnProperty.call(scenario, "value")) failures.push(issue("document.missing-scenario-value", "Scenario value is required.", [...scenarioPath, "value"], { formUid }));
          if (Object.prototype.hasOwnProperty.call(scenario, "context") && !isPlainRecord(own(scenario, "context"))) failures.push(issue("document.invalid-context", "Scenario context must be an object.", [...scenarioPath, "context"], { formUid }));
          if (Object.prototype.hasOwnProperty.call(scenario, "extensions") && !isPlainRecord(own(scenario, "extensions"))) failures.push(issue("document.invalid-extensions", "Scenario extensions must be an object.", [...scenarioPath, "extensions"], { formUid }));
        });
      }
      if (!Array.isArray(own(formUnknown, "rootNodeUids"))) failures.push(issue("document.invalid-roots", "rootNodeUids must be an array.", [...formPath, "rootNodeUids"], { formUid }));
      if (!isPlainRecord(own(formUnknown, "settings"))) failures.push(issue("document.invalid-settings", "settings must be a JSON object.", [...formPath, "settings"], { formUid }));
      checkGraph(formUnknown, formUid, formPath, limits.maxDepth, failures);
    }
  }
  if (isPlainRecord(fragments)) {
    const fragmentEntries = Object.entries(fragments);
    if (fragmentEntries.length > limits.maxFragments) failures.push(issue("document.fragment-limit", `Project exceeds the ${limits.maxFragments}-fragment limit.`, ["fragments"]));
    const fragmentUids = new Set(fragmentEntries.map(([key]) => key));
    const checkInstance = (node: Record<string, unknown>, nodePath: DiagnosticPath, entityUid?: Uid): void => {
      const target = own(node, "fragmentUid");
      const definition = typeof target === "string" ? fragments[target] : undefined;
      if (!isUid(target) || !fragmentUids.has(target)) failures.push(issue("document.unresolved-fragment", `Fragment reference ${JSON.stringify(target)} does not resolve.`, [...nodePath, "fragmentUid"], entityUid ? { entityUid } : {}));
      const overrides = own(node, "overrides");
      if (overrides === undefined) return;
      if (!isPlainRecord(overrides)) { failures.push(issue("document.invalid-fragment-overrides", "Fragment overrides must be a UID-keyed object.", [...nodePath, "overrides"], entityUid ? { entityUid } : {})); return; }
      const definitionNodes = isPlainRecord(definition) && isPlainRecord(definition["nodes"]) ? definition["nodes"] : undefined;
      for (const [sourceUid, override] of Object.entries(overrides)) {
        const path = [...nodePath, "overrides", sourceUid];
        if (!definitionNodes || !Object.prototype.hasOwnProperty.call(definitionNodes, sourceUid)) failures.push(issue("document.unresolved-fragment-override", `Override target ${sourceUid} does not exist in fragment ${String(target)}.`, path, entityUid ? { entityUid } : {}));
        if (!isPlainRecord(override) || Object.keys(override).some((key) => key !== "runtimeId" && key !== "props" && key !== "presentation")) { failures.push(issue("document.invalid-fragment-overrides", "An override may contain runtimeId, props, and presentation only.", path, entityUid ? { entityUid } : {})); continue; }
        const runtimeId = own(override, "runtimeId");
        if (runtimeId !== undefined && (typeof runtimeId !== "string" || runtimeId.length === 0 || runtimeId.length > 128 || !isSafeObjectKey(runtimeId))) failures.push(issue("document.invalid-runtime-id", "Override runtimeId must be a non-empty safe key of at most 128 characters.", [...path, "runtimeId"], entityUid ? { entityUid } : {}));
        if (own(override, "props") !== undefined && !isPlainRecord(own(override, "props"))) failures.push(issue("document.invalid-fragment-overrides", "Override props must be an object.", [...path, "props"], entityUid ? { entityUid } : {}));
        if (own(override, "presentation") !== undefined && !isPlainRecord(own(override, "presentation"))) failures.push(issue("document.invalid-fragment-overrides", "Override presentation must be an object.", [...path, "presentation"], entityUid ? { entityUid } : {}));
      }
    };
    for (const [fragmentKey, fragmentUnknown] of fragmentEntries) {
      const fragmentPath: DiagnosticPath = ["fragments", fragmentKey];
      if (!isPlainRecord(fragmentUnknown)) { failures.push(issue("document.invalid-fragment", "Fragment must be an object.", fragmentPath)); continue; }
      const fragmentUidValue = own(fragmentUnknown, "uid");
      if (!recordUid(failures, uids, fragmentUidValue, [...fragmentPath, "uid"])) continue;
      const fragmentUid = fragmentUidValue;
      if (fragmentKey !== fragmentUid) failures.push(issue("document.uid-key-mismatch", `Fragment key ${fragmentKey} does not match uid ${fragmentUid}.`, fragmentPath, { entityUid: fragmentUid }));
      if (typeof own(fragmentUnknown, "title") !== "string") failures.push(issue("document.invalid-title", "Fragment title must be a string.", [...fragmentPath, "title"], { entityUid: fragmentUid }));
      if (!Number.isSafeInteger(own(fragmentUnknown, "version")) || (own(fragmentUnknown, "version") as number) < 1) failures.push(issue("document.invalid-fragment-version", "Fragment version must be a positive integer.", [...fragmentPath, "version"], { entityUid: fragmentUid }));
      const parameters = own(fragmentUnknown, "parameters");
      if (!Array.isArray(parameters) || parameters.some((parameter) => typeof parameter !== "string" || !isSafeObjectKey(parameter))) failures.push(issue("document.invalid-fragment-parameters", "Fragment parameters must be safe string keys.", [...fragmentPath, "parameters"], { entityUid: fragmentUid }));
      const nodes = own(fragmentUnknown, "nodes");
      if (!isPlainRecord(nodes)) failures.push(issue("document.invalid-nodes", "Fragment nodes must be a UID-keyed object.", [...fragmentPath, "nodes"], { entityUid: fragmentUid }));
      else {
        const entries = Object.entries(nodes);
        totalNodes += entries.length;
        if (entries.length > limits.maxNodesPerFragment) failures.push(issue("document.fragment-node-limit", `Fragment exceeds the ${limits.maxNodesPerFragment}-node limit.`, [...fragmentPath, "nodes"], { entityUid: fragmentUid }));
        for (const [nodeKey, nodeUnknown] of entries) {
          const nodePath = [...fragmentPath, "nodes", nodeKey];
          if (!isPlainRecord(nodeUnknown)) { failures.push(issue("document.invalid-node", "Node must be an object.", nodePath, { entityUid: fragmentUid })); continue; }
          const nodeUid = own(nodeUnknown, "uid");
          if (recordUid(failures, uids, nodeUid, [...nodePath, "uid"]) && nodeKey !== nodeUid) failures.push(issue("document.uid-key-mismatch", `Node key ${nodeKey} does not match uid ${nodeUid}.`, nodePath, { entityUid: nodeUid }));
          const kind = own(nodeUnknown, "kind");
          const runtimeId = own(nodeUnknown, "runtimeId");
          if (kind !== "block" && (typeof runtimeId !== "string" || runtimeId.length === 0 || runtimeId.length > 128 || !isSafeObjectKey(runtimeId))) failures.push(issue("document.invalid-runtime-id", "runtimeId must be a non-empty safe key of at most 128 characters.", [...nodePath, "runtimeId"], isUid(nodeUid) ? { entityUid: nodeUid } : {}));
          if (kind === "field" || kind === "group" || kind === "collection" || kind === "wizard" || kind === "fragment") validateValidators(own(nodeUnknown, "validators"), [...nodePath, "validators"], failures, isUid(nodeUid) ? { entityUid: nodeUid } : {});
          if (kind === "fragment") {
            checkInstance(nodeUnknown, nodePath, isUid(nodeUid) ? nodeUid : undefined);
          } else if (kind === "field" || kind === "block") {
            const definition = own(nodeUnknown, "definition");
            if (!isPlainRecord(definition) || typeof own(definition, "key") !== "string" || !Number.isSafeInteger(own(definition, "version"))) failures.push(issue("document.invalid-definition", `${kind} definition requires a key and positive integer version.`, [...nodePath, "definition"]));
            if (!isPlainRecord(own(nodeUnknown, "props"))) failures.push(issue("document.invalid-props", `${kind} props must be a JSON object.`, [...nodePath, "props"]));
          } else if (kind === "wizard") {
            if (!Array.isArray(own(nodeUnknown, "stageUids"))) failures.push(issue("document.invalid-stages", "Wizard stageUids must be an array.", [...nodePath, "stageUids"]));
          } else if (kind === "group" || kind === "collection" || kind === "stage" || kind === "variant") {
            const childKey = kind === "collection" && Object.prototype.hasOwnProperty.call(nodeUnknown, "variantUids") ? "variantUids" : "childUids";
            if (!Array.isArray(own(nodeUnknown, childKey))) failures.push(issue("document.invalid-children", `${kind} ${childKey} must be an array.`, [...nodePath, childKey]));
          } else failures.push(issue("document.unknown-node-kind", "Unknown node kind.", [...nodePath, "kind"]));
        }
      }
      if (!Array.isArray(own(fragmentUnknown, "rootNodeUids"))) failures.push(issue("document.invalid-roots", "Fragment rootNodeUids must be an array.", [...fragmentPath, "rootNodeUids"], { entityUid: fragmentUid }));
      checkGraph(fragmentUnknown, fragmentUid, fragmentPath, limits.maxDepth, failures);
    }
    const visitFragment = (uid: string, path: string[]): void => {
      if (path.includes(uid)) {
        failures.push(issue("document.fragment-cycle", `Fragment graph contains a cycle through ${uid}.`, ["fragments", uid], isUid(uid) ? { entityUid: uid } : {}));
        return;
      }
      const fragment = fragments[uid];
      if (!isPlainRecord(fragment) || !isPlainRecord(fragment["nodes"])) return;
      for (const node of Object.values(fragment["nodes"])) {
        if (isPlainRecord(node) && node["kind"] === "fragment" && typeof node["fragmentUid"] === "string") visitFragment(node["fragmentUid"], [...path, uid]);
      }
    };
    for (const uid of fragmentUids) visitFragment(uid, []);
    if (isPlainRecord(formsValue)) for (const [formKey, formUnknown] of Object.entries(formsValue)) {
      if (!isPlainRecord(formUnknown) || !isPlainRecord(formUnknown["nodes"])) continue;
      for (const [nodeKey, nodeUnknown] of Object.entries(formUnknown["nodes"])) if (isPlainRecord(nodeUnknown) && nodeUnknown["kind"] === "fragment") {
        checkInstance(nodeUnknown, ["forms", formKey, "nodes", nodeKey], isUid(nodeKey) ? nodeKey : undefined);
      }
    }
  }
  if (totalNodes > limits.maxNodesPerProject) failures.push(issue("document.project-node-limit", `Project exceeds the ${limits.maxNodesPerProject}-node limit.`, ["forms"]));
  if (failures.length > 0) return { ok: false, diagnostics: failures.slice(0, MAX_DIAGNOSTICS) };
  return { ok: true, value: freezeClone(input) as unknown as StudioProjectDocument, migrations: [] };
}
