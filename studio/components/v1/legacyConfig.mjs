const STRUCTURAL_KEYS = new Set([
  "id",
  "type",
  "fields",
  "stages",
  "fieldset",
  "min",
  "max",
  "init",
  "isRendered",
  "isDisabled",
  "computedValue",
]);

function freeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value instanceof Date) return new Date(value.getTime());
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  }
  return value;
}

function addressKey(address) {
  return address.map((segment) => `${segment.kind}:${segment.id}`).join("/");
}

function presentationFor(item) {
  return Object.fromEntries(
    ["label", "secondaryText", "blockWidth"].flatMap((key) =>
      item[key] === undefined ? [] : [[key, clone(item[key])]],
    ),
  );
}

function propsFor(item) {
  return Object.fromEntries(
    Object.entries(item)
      .filter(([key]) => !STRUCTURAL_KEYS.has(key))
      .map(([key, value]) => [key, clone(value)]),
  );
}

function compileVisibility(value, diagnostics, path) {
  if (typeof value === "function") {
    return ({ path: fieldPath, fieldValue, value: formValue }) => {
      try {
        return value(fieldPath.join("."), fieldValue, formValue, {}) !== false;
      } catch {
        return true;
      }
    };
  }
  if (typeof value !== "string" || value.trim() === "") return value;
  try {
    const predicate = new Function(
      "path",
      "fieldData",
      "data",
      "interfaceState",
      `"use strict"; return (${value});`,
    );
    return ({ path: fieldPath, fieldValue, value: formValue }) => {
      try {
        return predicate(fieldPath.join("."), fieldValue, formValue, {}) !== false;
      } catch {
        return true;
      }
    };
  } catch {
    diagnostics.push({
      code: "studio.visibility.invalid",
      message: `Could not migrate the visibility expression at ${path.join(".")}.`,
      path,
    });
    return true;
  }
}

function compileComputedValue(value, diagnostics, path) {
  if (typeof value === "function") {
    return (data, itemData) => {
      try {
        return { ok: true, value: value(data, itemData, {}) };
      } catch {
        return { ok: false };
      }
    };
  }
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    const compute = new Function(
      "data",
      "itemData",
      "interfaceState",
      `"use strict"; return (${value});`,
    );
    return (data, itemData) => {
      try {
        return { ok: true, value: compute(data, itemData, {}) };
      } catch {
        return { ok: false };
      }
    };
  } catch {
    diagnostics.push({
      code: "studio.computed-value.invalid",
      message: `Could not migrate the computed-value expression at ${path.join(".")}.`,
      path,
    });
    return undefined;
  }
}

function computedTargets(value, pattern, index = 0, path = [], itemData = value) {
  const segment = pattern[index];
  if (segment === undefined) return [{ path, itemData }];
  const next = value !== null && typeof value === "object" ? value[segment.id] : undefined;
  if (segment.collection) {
    if (!Array.isArray(next)) return [];
    return next.flatMap((row, rowIndex) => computedTargets(
      row,
      pattern,
      index + 1,
      [...path, segment.id, rowIndex],
      row,
    ));
  }
  return computedTargets(next, pattern, index + 1, [...path, segment.id], itemData);
}

function computedTransform(computed) {
  return {
    on: [
      "init",
      "input",
      "collection:add",
      "collection:remove",
      "collection:replace",
      "collection:duplicate",
      "collection:move",
      "collection:sort",
    ],
    apply({ value }) {
      const patches = [];
      let workingValue = value;
      for (const { pattern, compute } of computed) {
        for (const target of computedTargets(workingValue, pattern)) {
          const result = compute(workingValue, target.itemData);
          if (!result.ok || Object.is(valueAtPreparedPath(workingValue, target.path), result.value)) continue;
          patches.push({ op: "set", path: target.path, value: result.value });
          workingValue = setPreparedValue(workingValue, target.path, result.value);
        }
      }
      return patches;
    },
  };
}

function requiredValidator(item, path) {
  const id = `${path.join(".")}.required`;
  return {
    id,
    on: ["input", "blur", "submit"],
    revealOn: ["blur", "submit"],
    validate({ fieldValue, path: fieldPath }) {
      const empty = fieldValue === undefined
        || fieldValue === null
        || fieldValue === ""
        || (Array.isArray(fieldValue) && fieldValue.length === 0);
      return empty
        ? [{
            id,
            code: "required",
            message: `${item.label || item.id} is required.`,
            path: fieldPath,
            severity: "error",
          }]
        : [];
    },
  };
}

function normalizeFieldsetNodes(item, fieldset) {
  const nodes = Array.isArray(fieldset?.config) ? fieldset.config : [];
  if (nodes.length === 1 && nodes[0]?.type === "group"
    && (nodes[0].id === item.id || nodes[0].id === item.fieldset)) {
    return nodes[0].fields || [];
  }
  return nodes;
}

function convertNodes(items, context, parentPath = [], parentAddress = [], parentPattern = []) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item, index) => {
    if (item === null || typeof item !== "object") {
      context.diagnostics.push({
        code: "studio.node.invalid",
        message: `Ignored an invalid configuration entry at index ${index}.`,
        path: parentPath,
      });
      return [];
    }

    const id = typeof item.id === "string" && item.id !== "" ? item.id : `field${index + 1}`;
    const path = [...parentPath, id];
    const address = [...parentAddress, { kind: "node", id }];
    const pattern = [...parentPattern, { id, collection: item.type === "collection" }];
    const presentation = presentationFor(item);
    if (Object.keys(presentation).length > 0) context.presentation[addressKey(address)] = presentation;

    const behavior = {};
    if (item.isDisabled !== undefined) behavior.disabled = Boolean(item.isDisabled);
    if (item.isRendered !== undefined) {
      behavior.when = compileVisibility(item.isRendered, context.diagnostics, path);
    }

    if (item.type === "group") {
      return [{
        kind: "group",
        id,
        ...behavior,
        nodes: convertNodes(item.fields, context, path, address, pattern),
      }];
    }

    if (item.type === "collection") {
      const collection = {
        kind: "collection",
        id,
        ...behavior,
        ...(Number.isInteger(item.min) && item.min >= 0 ? { min: item.min } : {}),
        ...(Number.isInteger(item.max) && item.max >= 0 ? { max: item.max } : {}),
      };
      if (item.fields !== null && typeof item.fields === "object" && !Array.isArray(item.fields)) {
        const variants = Object.fromEntries(Object.entries(item.fields).map(([variant, fields]) => [variant, {
          nodes: convertNodes(fields, context, path, address, pattern),
        }]));
        collection.discriminator = "__typename";
        collection.variants = variants;
        context.presentation[addressKey(address)] = {
          ...(context.presentation[addressKey(address)] || {}),
          variants: Object.keys(variants),
        };
      } else {
        collection.nodes = convertNodes(item.fields, context, path, address, pattern);
      }
      return [collection];
    }

    if (item.type === "wizard") {
      const stages = Array.isArray(item.stages) ? item.stages : [];
      return [{
        kind: "wizard",
        id,
        ...behavior,
        navigation: { validateCurrent: true },
        stages: stages.map((stage, stageIndex) => {
          const stageId = typeof stage?.id === "string" && stage.id !== ""
            ? stage.id
            : `stage${stageIndex + 1}`;
          const stagePath = [...path, stageId];
          const stageAddress = [...address, { kind: "node", id: stageId }];
          const stagePresentation = presentationFor(stage || {});
          if (Object.keys(stagePresentation).length > 0) {
            context.presentation[addressKey(stageAddress)] = stagePresentation;
          }
          return {
            id: stageId,
            nodes: convertNodes(
              stage?.fields,
              context,
              stagePath,
              stageAddress,
              [...pattern, { id: stageId, collection: false }],
            ),
          };
        }),
      }];
    }

    if (item.type === "fieldset") {
      const fieldset = context.fieldsets.get(item.fieldset);
      if (fieldset === undefined) {
        context.diagnostics.push({
          code: "studio.fieldset.missing",
          message: `Could not find fieldset “${item.fieldset}” used at ${path.join(".")}.`,
          path,
        });
      }
      return [{
        kind: "group",
        id,
        ...behavior,
        nodes: convertNodes(normalizeFieldsetNodes(item, fieldset), context, path, address, pattern),
      }];
    }

    if (!context.fieldTypes.has(item.type)) {
      context.diagnostics.push({
        code: "studio.field-type.unknown",
        message: `Ignored unknown field type “${String(item.type)}” at ${path.join(".")}.`,
        path,
      });
      return [];
    }

    if (item.computedValue !== undefined) {
      const compute = compileComputedValue(item.computedValue, context.diagnostics, path);
      if (compute !== undefined) context.computed.push({ pattern, compute });
    }

    return [{
      kind: "field",
      id,
      type: item.type,
      ...behavior,
      props: propsFor(item),
      ...(item.isRequired ? { validators: [requiredValidator(item, path)] } : {}),
    }];
  });
}

export function convertLegacyConfig(config, options = {}) {
  const diagnostics = [];
  const presentation = {};
  const context = {
    diagnostics,
    presentation,
    computed: [],
    fieldTypes: new Set(options.fieldTypes || []),
    fieldsets: new Map((options.fieldsets || []).map((fieldset) => [fieldset.id, fieldset])),
  };
  const schema = {
    id: options.schemaId || "studio-preview",
    version: 1,
    nodes: convertNodes(config, context),
    ...(context.computed.length > 0 ? { transforms: [computedTransform(context.computed)] } : {}),
  };
  return freeze({ schema, diagnostics, presentation });
}

export function studioPresentationKey(address) {
  return addressKey(address.filter((segment) => segment.kind !== "row"));
}

function prepareNodes(nodes, input) {
  const source = input !== null && typeof input === "object" && !Array.isArray(input) ? input : {};
  let output = source;
  const set = (id, value) => {
    if (output === source) output = { ...source };
    output[id] = value;
  };

  for (const node of nodes) {
    if (node.kind === "field") {
      if (source[node.id] === undefined && node.props?.defaultValue !== undefined) {
        set(node.id, clone(node.props.defaultValue));
      }
      continue;
    }
    if (node.kind === "collection") {
      const current = Array.isArray(source[node.id]) ? source[node.id] : [];
      const rowNodes = (row) => node.variants?.[row?.[node.discriminator]]?.nodes || node.nodes || [];
      const rows = current.map((row) => prepareNodes(rowNodes(row), row));
      while (rows.length < (node.min || 0)) rows.push(prepareNodes(node.nodes || [], {}));
      if (current !== source[node.id] || rows.some((row, index) => row !== current[index]) || rows.length !== current.length) {
        set(node.id, rows);
      }
      continue;
    }
    const children = node.kind === "wizard"
      ? node.stages.flatMap((stage) => [{ kind: "group", id: stage.id, nodes: stage.nodes }])
      : node.nodes;
    const prepared = prepareNodes(children, source[node.id]);
    if (prepared !== source[node.id]) set(node.id, prepared);
  }
  return output;
}

export function prepareStudioValue(schema, value) {
  let prepared = prepareNodes(schema.nodes, value);
  for (const transform of schema.transforms || []) {
    const events = Array.isArray(transform.on) ? transform.on : [transform.on];
    if (!events.includes("init")) continue;
    const patches = transform.apply({ value: prepared, event: { name: "init", target: { kind: "form" } } });
    for (const patch of patches) {
      if (patch.op !== "set") continue;
      prepared = setPreparedValue(prepared, patch.path, patch.value);
    }
  }
  return prepared;
}

function setPreparedValue(value, path, nextValue) {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  const source = value !== null && typeof value === "object"
    ? value
    : typeof head === "number" ? [] : {};
  const output = Array.isArray(source) ? source.slice() : { ...source };
  output[head] = setPreparedValue(source[head], tail, nextValue);
  return output;
}

function valueAtPreparedPath(value, path) {
  let current = value;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = current[segment];
  }
  return current;
}
