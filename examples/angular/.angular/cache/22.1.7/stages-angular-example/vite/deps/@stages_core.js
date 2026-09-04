//#region ../../packages/core/dist/path.js
var unsafeKeys$1 = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function isSafePathSegment(segment) {
	return typeof segment === "number" ? Number.isSafeInteger(segment) && segment >= 0 : !unsafeKeys$1.has(segment);
}
function assertSafePath(path) {
	for (const segment of path) if (!isSafePathSegment(segment)) throw new TypeError(`Unsafe path segment: ${String(segment)}`);
}
function getAtPath(value, path) {
	let current = value;
	for (const segment of path) {
		if (current === null || typeof current !== "object") return void 0;
		current = current[segment];
	}
	return current;
}
function copyContainer(value, nextSegment) {
	if (Array.isArray(value)) return value.slice();
	if (value !== null && typeof value === "object") return { ...value };
	return typeof nextSegment === "number" ? [] : {};
}
function setAtPath(value, path, nextValue) {
	assertSafePath(path);
	if (path.length === 0) return nextValue;
	const segment = path[0];
	if (segment === void 0) return nextValue;
	const child = getAtPath(value, [segment]);
	const nextChild = setAtPath(child, path.slice(1), nextValue);
	if (Object.is(child, nextChild)) return value;
	const copy = copyContainer(value, segment);
	copy[segment] = nextChild;
	return copy;
}
function removeAtPath(value, path) {
	assertSafePath(path);
	if (path.length === 0) return void 0;
	const segment = path[0];
	if (segment === void 0 || value === null || typeof value !== "object") return value;
	const child = getAtPath(value, [segment]);
	if (path.length > 1) {
		const nextChild = removeAtPath(child, path.slice(1));
		if (Object.is(child, nextChild)) return value;
		const copy = copyContainer(value, segment);
		copy[segment] = nextChild;
		return copy;
	}
	if (Array.isArray(value)) {
		if (typeof segment !== "number" || segment >= value.length) return value;
		const copy = value.slice();
		copy.splice(segment, 1);
		return copy;
	}
	if (!Object.prototype.hasOwnProperty.call(value, segment)) return value;
	const copy = { ...value };
	delete copy[String(segment)];
	return copy;
}
function applyPatches(value, patches) {
	return patches.reduce((current, patch) => patch.op === "set" ? setAtPath(current, patch.path, patch.value) : removeAtPath(current, patch.path), value);
}
function pathsEqual(left, right) {
	return left.length === right.length && left.every((segment, index) => segment === right[index]);
}
//#endregion
//#region ../../packages/core/dist/schema.js
function addressKey$1(address) {
	return address.map((segment) => `${segment.kind}:${segment.id.length}:${segment.id}`).join("/");
}
function diagnostic(code, message, path = [], address = []) {
	return {
		code,
		message,
		severity: "error",
		path,
		address
	};
}
function nodeContext(value, context, meta, path, address) {
	return {
		value,
		context,
		meta,
		path,
		address,
		fieldValue: getAtPath(value, path),
		parentValue: getAtPath(value, path.slice(0, -1))
	};
}
function resolveBoolean(resolver, context, fallback) {
	const resolved = typeof resolver === "function" ? resolver(context) : resolver;
	if (resolved === void 0) return fallback;
	if (typeof resolved !== "boolean") throw new TypeError("Predicate must return a boolean.");
	return resolved;
}
function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function validEventPolicy(value) {
	return typeof value === "string" ? value.length > 0 : Array.isArray(value) && value.length > 0 && value.every((name) => typeof name === "string" && name.length > 0);
}
function validTransforms(value) {
	return value === void 0 || Array.isArray(value) && value.every((candidate) => {
		if (!isRecord(candidate) || !validEventPolicy(candidate["on"]) || typeof candidate["apply"] !== "function") return false;
		return candidate["when"] === void 0 || typeof candidate["when"] === "function";
	});
}
function validValidators(value) {
	if (value === void 0) return true;
	if (!Array.isArray(value)) return false;
	const ids = /* @__PURE__ */ new Set();
	return value.every((candidate) => {
		if (!isRecord(candidate)) return false;
		const id = candidate["id"];
		if (typeof id !== "string" || id.length === 0 || ids.has(id)) return false;
		ids.add(id);
		if (!validEventPolicy(candidate["on"]) || typeof candidate["validate"] !== "function") return false;
		if (candidate["revealOn"] !== void 0 && !validEventPolicy(candidate["revealOn"])) return false;
		if (candidate["includeDisabled"] !== void 0 && typeof candidate["includeDisabled"] !== "boolean") return false;
		if (candidate["when"] !== void 0 && typeof candidate["when"] !== "function") return false;
		const dependencies = candidate["dependencies"];
		return dependencies === void 0 || Array.isArray(dependencies) && dependencies.every((path) => Array.isArray(path) && path.every((segment) => (typeof segment === "string" || typeof segment === "number") && isSafePathSegment(segment)));
	});
}
function validateBehavior(candidate, diagnostics, path, address) {
	let valid = true;
	if (!validTransforms(candidate["transforms"])) {
		diagnostics.push(diagnostic("schema.invalid-transform", "Transforms require valid event policies and apply functions.", path, address));
		valid = false;
	}
	if (!validValidators(candidate["validators"])) {
		diagnostics.push(diagnostic("schema.invalid-validator", "Validators require unique IDs, valid event policies, dependencies, and validate functions.", path, address));
		valid = false;
	}
	return valid;
}
function hasField(fields, name) {
	return fields !== null && typeof fields === "object" && Object.prototype.hasOwnProperty.call(fields, name);
}
function registeredField(fields, name) {
	return fields !== null && typeof fields === "object" ? fields[name] : void 0;
}
function validFieldDefinition(value) {
	if (!isRecord(value)) return false;
	if (value["reduce"] !== void 0 && typeof value["reduce"] !== "function") return false;
	const validators = value["validators"];
	if (validators === void 0) return true;
	if (!Array.isArray(validators)) return false;
	const ids = /* @__PURE__ */ new Set();
	return validators.every((validator) => {
		if (!isRecord(validator)) return false;
		const id = validator["id"];
		if (typeof id !== "string" || id.length === 0 || ids.has(id) || typeof validator["validate"] !== "function") return false;
		ids.add(id);
		return true;
	});
}
function walkNodes(configs, parentPath, parentAddress, parentDisabled, parentVisible, walk) {
	const siblingIds = /* @__PURE__ */ new Set();
	const normalized = [];
	for (const config of configs) {
		const candidate = config;
		if (!isRecord(candidate) || typeof candidate["id"] !== "string") {
			walk.diagnostics.push(diagnostic("schema.invalid-node", "Schema nodes require a string id.", parentPath, parentAddress));
			continue;
		}
		const path = [...parentPath, config.id];
		const address = [...parentAddress, {
			kind: "node",
			id: config.id
		}];
		if (candidate["kind"] !== "field" && candidate["kind"] !== "group" && candidate["kind"] !== "collection" && candidate["kind"] !== "wizard") {
			walk.diagnostics.push(diagnostic("schema.invalid-kind", `Unknown node kind "${String(candidate["kind"])}".`, path, address));
			continue;
		}
		if (!isSafePathSegment(config.id)) {
			walk.diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe node id \"${config.id}\".`, path, address));
			continue;
		}
		if (siblingIds.has(config.id)) {
			walk.diagnostics.push(diagnostic("schema.duplicate-id", `Duplicate sibling id \"${config.id}\".`, path, address));
			continue;
		}
		siblingIds.add(config.id);
		if (!validateBehavior(candidate, walk.diagnostics, path, address)) continue;
		if (config.kind === "field" && config.props !== void 0 && !isRecord(config.props)) {
			walk.diagnostics.push(diagnostic("schema.invalid-props", `Props for "${config.id}" must be an object.`, path, address));
			continue;
		}
		const resolverContext = nodeContext(walk.value, walk.context, walk.meta, path, address);
		let visible = true;
		let disabled = parentDisabled;
		let props = {};
		try {
			visible = parentVisible && resolveBoolean(config.when, resolverContext, true);
			disabled = parentDisabled || resolveBoolean(config.disabled, resolverContext, false);
			if (config.kind === "field") {
				props = { ...config.props };
				if (config.deriveProps !== void 0) {
					const derived = config.deriveProps(resolverContext);
					if (!isRecord(derived)) throw new TypeError("Derived props must be an object.");
					props = {
						...props,
						...derived
					};
				}
			}
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for \"${config.id}\" failed: ${detail}`, path, address));
			continue;
		}
		let children = [];
		let branches = [];
		if (config.kind === "field") {
			if (typeof config.type !== "string") {
				walk.diagnostics.push(diagnostic("schema.unknown-field", `Field "${config.id}" requires a string type.`, path, address));
				continue;
			}
			if (!hasField(walk.fields, config.type)) {
				walk.diagnostics.push(diagnostic("schema.unknown-field", `Unknown field type \"${config.type}\".`, path, address));
				continue;
			}
			if (!validFieldDefinition(registeredField(walk.fields, config.type))) {
				walk.diagnostics.push(diagnostic("schema.invalid-field-definition", `Field type "${config.type}" has an invalid definition.`, path, address));
				continue;
			}
		} else if (config.kind === "group") {
			if (!Array.isArray(config.nodes)) {
				walk.diagnostics.push(diagnostic("schema.invalid-nodes", `Group "${config.id}" nodes must be an array.`, path, address));
				continue;
			}
			children = walkNodes(config.nodes, path, address, disabled, visible, walk);
		} else if (config.kind === "collection") {
			const runtimeConfig = config;
			const definesNodes = candidate["nodes"] !== void 0;
			const definesVariants = candidate["variants"] !== void 0;
			const hasNodes = Array.isArray(runtimeConfig.nodes);
			const hasVariants = isRecord(runtimeConfig.variants);
			if (definesNodes === definesVariants || definesNodes !== hasNodes || definesVariants !== hasVariants) {
				walk.diagnostics.push(diagnostic("schema.collection-shape", `Collection \"${config.id}\" must define exactly one of nodes or variants.`, path, address));
				continue;
			}
			if (config.itemKey !== void 0 && typeof config.itemKey !== "function") {
				walk.diagnostics.push(diagnostic("schema.item-key", `Collection "${config.id}" itemKey must be a function.`, path, address));
				continue;
			}
			if (config.min !== void 0 && (!Number.isSafeInteger(config.min) || config.min < 0)) walk.diagnostics.push(diagnostic("schema.collection-min", `Collection \"${config.id}\" has an invalid min.`, path, address));
			if (config.max !== void 0 && (!Number.isSafeInteger(config.max) || config.max < 0)) walk.diagnostics.push(diagnostic("schema.collection-max", `Collection \"${config.id}\" has an invalid max.`, path, address));
			if (config.min !== void 0 && config.max !== void 0 && config.min > config.max) walk.diagnostics.push(diagnostic("schema.collection-range", `Collection \"${config.id}\" has min greater than max.`, path, address));
			const collectionValue = getAtPath(walk.value, path);
			if (collectionValue !== void 0 && !Array.isArray(collectionValue)) walk.diagnostics.push(diagnostic("schema.collection-value", `Collection \"${config.id}\" requires an array value.`, path, address));
			if (hasVariants) {
				if (typeof config.discriminator !== "string" || !isSafePathSegment(config.discriminator)) {
					walk.diagnostics.push(diagnostic("schema.unsafe-discriminator", `Invalid discriminator \"${String(config.discriminator)}\".`, path, address));
					continue;
				}
				let variantsValid = true;
				const variants = Object.entries(runtimeConfig.variants ?? {});
				if (variants.length === 0) {
					walk.diagnostics.push(diagnostic("schema.invalid-variant", `Collection "${config.id}" must define at least one variant.`, path, address));
					variantsValid = false;
				}
				for (const [variantName, variant] of variants) {
					if (!isSafePathSegment(variantName)) {
						walk.diagnostics.push(diagnostic("schema.unsafe-variant", `Unsafe variant \"${variantName}\".`, path, address));
						variantsValid = false;
					}
					if (!isRecord(variant) || !Array.isArray(variant["nodes"])) {
						walk.diagnostics.push(diagnostic("schema.invalid-variant", `Variant \"${variantName}\" must define a nodes array.`, path, address));
						variantsValid = false;
					}
				}
				if (!variantsValid) continue;
			}
			const rows = Array.isArray(collectionValue) ? collectionValue : [];
			const rowKeys = /* @__PURE__ */ new Set();
			const storedRowKeys = walk.collectionKeys.get(addressKey$1(address));
			const rowChildren = [];
			const rowBranches = [];
			rows.forEach((row, index) => {
				let rowKey = storedRowKeys?.[index] ?? String(index);
				try {
					rowKey = config.itemKey?.(row, index) ?? rowKey;
					if (typeof rowKey !== "string" || rowKey.length === 0) throw new TypeError("Item keys must be non-empty strings.");
				} catch (error) {
					const detail = error instanceof Error ? error.message : String(error);
					walk.diagnostics.push(diagnostic("schema.item-key-failed", `Item key for \"${config.id}\" failed: ${detail}`, [...path, index], address));
					return;
				}
				const rowAddress = [...address, {
					kind: "row",
					id: rowKey
				}];
				if (rowKeys.has(rowKey)) {
					walk.diagnostics.push(diagnostic("schema.duplicate-row-key", `Duplicate row key \"${rowKey}\".`, [...path, index], rowAddress));
					return;
				}
				rowKeys.add(rowKey);
				let rowNodes = config.nodes;
				if (config.variants !== void 0) {
					const variantName = row !== null && typeof row === "object" ? row[config.discriminator] : void 0;
					rowNodes = typeof variantName === "string" ? config.variants[variantName]?.nodes : void 0;
					if (rowNodes === void 0) {
						walk.diagnostics.push(diagnostic("schema.unknown-variant", `Row ${index} has unknown variant \"${String(variantName)}\".`, [...path, index], rowAddress));
						return;
					}
				}
				const normalizedRowNodes = walkNodes(rowNodes ?? [], [...path, index], rowAddress, disabled, visible, walk);
				rowChildren.push(...normalizedRowNodes);
				rowBranches.push({
					kind: "row",
					id: rowKey,
					path: [...path, index],
					address: rowAddress,
					visible,
					disabled,
					children: normalizedRowNodes
				});
			});
			children = rowChildren;
			branches = rowBranches;
		} else {
			if (!Array.isArray(config.stages)) {
				walk.diagnostics.push(diagnostic("schema.invalid-wizard", `Wizard "${config.id}" stages must be an array.`, path, address));
				continue;
			}
			const stageIds = /* @__PURE__ */ new Set();
			const validStages = [];
			for (const stage of config.stages) {
				const stageCandidate = stage;
				if (!isRecord(stageCandidate) || typeof stageCandidate["id"] !== "string" || !Array.isArray(stageCandidate["nodes"])) {
					walk.diagnostics.push(diagnostic("schema.invalid-stage", `Wizard "${config.id}" contains a malformed stage.`, path, address));
					continue;
				}
				const stagePath = [...path, stage.id];
				const stageAddress = [...address, {
					kind: "node",
					id: stage.id
				}];
				if (!isSafePathSegment(stage.id) || stageIds.has(stage.id)) {
					walk.diagnostics.push(diagnostic("schema.invalid-stage", `Invalid or duplicate stage id \"${stage.id}\".`, stagePath, stageAddress));
					continue;
				}
				stageIds.add(stage.id);
				validStages.push(stage);
			}
			if (config.initialStage !== void 0 && !stageIds.has(config.initialStage)) walk.diagnostics.push(diagnostic("schema.wizard-target", `Unknown initial stage \"${config.initialStage}\".`, path, address));
			const stageChildren = [];
			const stageBranches = [];
			for (const stage of validStages) {
				const stagePath = [...path, stage.id];
				const stageAddress = [...address, {
					kind: "node",
					id: stage.id
				}];
				const stageContext = nodeContext(walk.value, walk.context, walk.meta, stagePath, stageAddress);
				try {
					const stageVisible = resolveBoolean(stage.when, stageContext, true);
					if (!stageVisible) continue;
					const stageDisabled = disabled || resolveBoolean(stage.disabled, stageContext, false);
					const normalizedStageNodes = walkNodes(stage.nodes, stagePath, stageAddress, stageDisabled, stageVisible && visible, walk);
					stageChildren.push(...normalizedStageNodes);
					stageBranches.push({
						kind: "stage",
						id: stage.id,
						path: stagePath,
						address: stageAddress,
						visible: stageVisible && visible,
						disabled: stageDisabled,
						children: normalizedStageNodes
					});
				} catch (error) {
					const detail = error instanceof Error ? error.message : String(error);
					walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for stage \"${stage.id}\" failed: ${detail}`, stagePath, stageAddress));
				}
			}
			children = stageChildren;
			branches = stageBranches;
		}
		normalized.push({
			config,
			path,
			address,
			visible,
			disabled,
			props,
			children,
			branches
		});
	}
	return normalized;
}
function evaluateSchema(options) {
	const diagnostics = [];
	let schema;
	try {
		schema = typeof options.schema === "function" ? options.schema({
			value: options.value,
			context: options.context,
			meta: options.meta
		}) : options.schema;
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new TypeError(`Schema factory failed: ${detail}`);
	}
	if (!isRecord(schema)) throw new TypeError("Schema factory must return an object.");
	if (typeof schema.id !== "string" || !isSafePathSegment(schema.id)) diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe schema id \"${schema.id}\".`));
	if (!Number.isSafeInteger(schema.version) || schema.version < 1) diagnostics.push(diagnostic("schema.invalid-version", "Schema version must be a positive safe integer."));
	const rootBehaviorValid = validateBehavior(schema, diagnostics, [], []);
	const nodes = Array.isArray(schema.nodes) ? walkNodes(schema.nodes, [], [], false, true, {
		value: options.value,
		context: options.context,
		meta: options.meta,
		fields: options.fields,
		diagnostics,
		collectionKeys: options.collectionKeys ?? /* @__PURE__ */ new Map()
	}) : [];
	if (!Array.isArray(schema.nodes)) diagnostics.push(diagnostic("schema.invalid-nodes", "Schema nodes must be an array."));
	return {
		schema: rootBehaviorValid ? schema : {
			...schema,
			transforms: [],
			validators: []
		},
		nodes,
		diagnostics
	};
}
function initialFieldValue(definition) {
	return typeof definition.initialValue === "function" ? definition.initialValue() : definition.initialValue;
}
//#endregion
//#region ../../packages/core/dist/collections.js
function validInsertionIndex(index, length) {
	return Number.isSafeInteger(index) && index >= 0 && index <= length;
}
function validItemIndex(index, length) {
	return Number.isSafeInteger(index) && index >= 0 && index < length;
}
function reject(code, message) {
	return {
		accepted: false,
		code,
		message
	};
}
function reduceCollectionCommand(current, command, constraints = {}) {
	if (command.name === "collection:add") {
		if (constraints.max !== void 0 && current.length >= constraints.max) return reject("collection.max", `Collection already contains the maximum of ${constraints.max} items.`);
		const index = command.index ?? current.length;
		if (!validInsertionIndex(index, current.length)) return reject("collection.index", `Invalid insertion index ${index}.`);
		const next = current.slice();
		next.splice(index, 0, command.item);
		return {
			accepted: true,
			value: next
		};
	}
	if (command.name === "collection:remove") {
		if (constraints.min !== void 0 && current.length <= constraints.min) return reject("collection.min", `Collection must retain at least ${constraints.min} items.`);
		if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
		const next = current.slice();
		next.splice(command.index, 1);
		return {
			accepted: true,
			value: next
		};
	}
	if (command.name === "collection:replace") {
		if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
		if (Object.is(current[command.index], command.item)) return reject("collection.unchanged", "Replacement item is unchanged.");
		const next = current.slice();
		next[command.index] = command.item;
		return {
			accepted: true,
			value: next
		};
	}
	if (command.name === "collection:duplicate") {
		if (constraints.max !== void 0 && current.length >= constraints.max) return reject("collection.max", `Collection already contains the maximum of ${constraints.max} items.`);
		if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
		const toIndex = command.toIndex ?? command.index + 1;
		if (!validInsertionIndex(toIndex, current.length)) return reject("collection.index", `Invalid insertion index ${toIndex}.`);
		const next = current.slice();
		next.splice(toIndex, 0, current[command.index]);
		return {
			accepted: true,
			value: next
		};
	}
	if (command.name === "collection:move") {
		if (!validItemIndex(command.from, current.length) || !validItemIndex(command.to, current.length)) return reject("collection.index", `Invalid move from ${command.from} to ${command.to}.`);
		if (command.from === command.to) return reject("collection.unchanged", "Move source and destination are equal.");
		const next = current.slice();
		const removed = next.splice(command.from, 1);
		next.splice(command.to, 0, removed[0]);
		return {
			accepted: true,
			value: next
		};
	}
	if (command.order.length !== current.length) return reject("collection.order", "Sort order must contain every collection index exactly once.");
	if (new Set(command.order).size !== current.length || command.order.some((index) => !validItemIndex(index, current.length))) return reject("collection.order", "Sort order must be a permutation of collection indexes.");
	if (command.order.every((index, position) => index === position)) return reject("collection.unchanged", "Sort order is unchanged.");
	return {
		accepted: true,
		value: command.order.map((index) => current[index])
	};
}
//#endregion
//#region ../../packages/core/dist/serialization.js
var SerializationError = class extends TypeError {
	constructor(code, message, path = []) {
		super(`${message} at ${JSON.stringify(path)}.`);
		this.name = "SerializationError";
		this.code = code;
		this.path = path;
	}
};
function isPlainObject(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
var unsafeKeys = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function encodeJson(value, path = [], seen = /* @__PURE__ */ new Set()) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (Number.isFinite(value)) return value;
		throw new SerializationError("json.non-finite", "Non-finite number", path);
	}
	if (typeof value !== "object") throw new SerializationError("json.unsupported", `Unsupported ${typeof value}`, path);
	if (seen.has(value)) throw new SerializationError("json.cycle", "Cyclic value", path);
	if (!Array.isArray(value) && !isPlainObject(value)) throw new SerializationError("json.object", "Unsupported object", path);
	seen.add(value);
	try {
		if (Array.isArray(value)) return value.map((item, index) => encodeJson(item, [...path, index], seen));
		const output = {};
		for (const [key, item] of Object.entries(value)) {
			if (unsafeKeys.has(key)) throw new SerializationError("json.unsafe-key", `Unsafe object key \"${key}\"`, [...path, key]);
			output[key] = encodeJson(item, [...path, key], seen);
		}
		return output;
	} finally {
		seen.delete(value);
	}
}
function decodeJson(value, path = []) {
	if (value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.map((item, index) => decodeJson(item, [...path, index]));
	const output = {};
	for (const [key, item] of Object.entries(value)) {
		if (unsafeKeys.has(key)) throw new SerializationError("json.unsafe-key", `Unsafe object key \"${key}\"`, [...path, key]);
		output[key] = decodeJson(item, [...path, key]);
	}
	return output;
}
function requireJson(value, path) {
	return encodeJson(value, path);
}
function validateSerializedState(value) {
	if (!isPlainObject(value)) throw new SerializationError("state.envelope", "Serialized state must be an object");
	if (value["format"] !== "stages") throw new SerializationError("state.format", "Unsupported serialized format", ["format"]);
	if (value["formatVersion"] !== 1) throw new SerializationError("state.format-version", "Unsupported serialized format version", ["formatVersion"]);
	const schema = value["schema"];
	if (!isPlainObject(schema) || typeof schema["id"] !== "string") throw new SerializationError("state.schema", "Serialized schema id must be a string", ["schema", "id"]);
	if (!Number.isSafeInteger(schema["version"]) || schema["version"] < 1) throw new SerializationError("state.schema", "Serialized schema version must be a positive safe integer", ["schema", "version"]);
	const meta = value["meta"];
	if (!isPlainObject(meta)) throw new SerializationError("state.meta", "Serialized metadata must be an object", ["meta"]);
	return {
		format: "stages",
		formatVersion: 1,
		schema: {
			id: schema["id"],
			version: schema["version"]
		},
		value: requireJson(value["value"], ["value"]),
		baseline: requireJson(value["baseline"], ["baseline"]),
		meta: requireJson(meta, ["meta"])
	};
}
function migrateSerializedState(input, migrations) {
	let state = validateSerializedState(input);
	const visited = /* @__PURE__ */ new Set();
	while (true) {
		if (visited.has(state.schema.version)) throw new SerializationError("migration.cycle", "Schema migration cycle detected", ["schema", "version"]);
		visited.add(state.schema.version);
		const matches = migrations.filter((migration) => migration.schemaId === state.schema.id && migration.fromVersion === state.schema.version);
		if (matches.length === 0) return state;
		if (matches.length > 1) throw new SerializationError("migration.ambiguous", `Multiple migrations start at schema version ${state.schema.version}`, ["schema", "version"]);
		const migration = matches[0];
		if (migration === void 0 || migration.toVersion <= migration.fromVersion) throw new SerializationError("migration.version", "Migration versions must increase", ["schema", "version"]);
		let migratedOutput;
		try {
			migratedOutput = migration.migrate(state);
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			throw new SerializationError("migration.failed", `Migration ${migration.schemaId}@${migration.fromVersion} failed: ${detail}`, ["schema", "version"]);
		}
		const migrated = validateSerializedState(migratedOutput);
		if (migrated.schema.id !== migration.schemaId || migrated.schema.version !== migration.toVersion) throw new SerializationError("migration.output", `Migration must produce ${migration.schemaId}@${migration.toVersion}`, ["schema"]);
		state = migrated;
	}
}
//#endregion
//#region ../../packages/core/dist/controller.js
var emptyValidation = {
	status: "unknown",
	isValid: false,
	issues: [],
	visibleIssues: [],
	pendingCount: 0,
	unknownCount: 1
};
function readonlyValue(value) {
	return value;
}
function addressKey(address) {
	return address.map((segment) => `${segment.kind}:${segment.id.length}:${segment.id}`).join("/");
}
function addressStartsWith(address, prefix) {
	return prefix.length <= address.length && prefix.every((segment, index) => {
		const candidate = address[index];
		return candidate?.kind === segment.kind && candidate.id === segment.id;
	});
}
function fieldDefinition(fields, type) {
	if (fields === null || typeof fields !== "object") return void 0;
	return fields[type];
}
function deepEqual(left, right) {
	if (Object.is(left, right)) return true;
	if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
		return left.every((item, index) => deepEqual(item, right[index]));
	}
	const leftRecord = left;
	const rightRecord = right;
	const keys = Object.keys(leftRecord);
	return keys.length === Object.keys(rightRecord).length && keys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && deepEqual(leftRecord[key], rightRecord[key]));
}
function indexSnapshotNodes(nodes, index = /* @__PURE__ */ new Map()) {
	for (const node of nodes) {
		index.set(addressKey(node.address), node);
		if (node.kind !== "field") indexSnapshotNodes(node.nodes, index);
	}
	return index;
}
function shareSnapshotNode(next, previous) {
	const previousNode = previous.get(addressKey(next.address));
	if (next.kind === "field") return previousNode !== void 0 && deepEqual(previousNode, next) ? previousNode : next;
	const sharedChildren = next.nodes.map((node) => shareSnapshotNode(node, previous));
	const candidate = sharedChildren.every((node, index) => node === next.nodes[index]) ? next : {
		...next,
		nodes: sharedChildren
	};
	return previousNode !== void 0 && deepEqual(previousNode, candidate) ? previousNode : candidate;
}
function eventNames(value) {
	if (value === void 0) return [];
	return typeof value === "string" ? [value] : value;
}
function validationRecordKey(address, validatorId) {
	return `${addressKey(address)}#${validatorId.length}:${validatorId}`;
}
var passiveValidationSignal = {
	aborted: false,
	onCancel: () => () => void 0
};
function createValidationCancellation() {
	let aborted = false;
	const listeners = /* @__PURE__ */ new Set();
	return {
		signal: {
			get aborted() {
				return aborted;
			},
			onCancel(listener) {
				if (aborted) {
					listener();
					return () => void 0;
				}
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		},
		cancel() {
			if (aborted) return;
			aborted = true;
			for (const listener of [...listeners]) listener();
			listeners.clear();
		}
	};
}
function pathsIntersect(left, right) {
	const commonLength = Math.min(left.length, right.length);
	return pathsEqual(left.slice(0, commonLength), right.slice(0, commonLength));
}
function checkedValidationIssues(value) {
	if (!Array.isArray(value)) throw new TypeError("Validator result must be an array of issues.");
	for (const issue of value) {
		if (issue === null || typeof issue !== "object" || Array.isArray(issue)) throw new TypeError("Each validation issue must be an object.");
		const candidate = issue;
		const path = candidate["path"];
		const meta = candidate["meta"];
		if (typeof candidate["id"] !== "string" || candidate["id"].length === 0 || typeof candidate["code"] !== "string" || candidate["code"].length === 0 || candidate["severity"] !== "error" && candidate["severity"] !== "warning" || !Array.isArray(path) || !path.every((segment) => (typeof segment === "string" || typeof segment === "number") && isSafePathSegment(segment)) || candidate["message"] !== void 0 && typeof candidate["message"] !== "string" || meta !== void 0 && (meta === null || typeof meta !== "object" || Array.isArray(meta))) throw new TypeError("Validator returned a malformed issue.");
	}
	return value;
}
function initialScopeValue(nodes, fields) {
	const value = {};
	for (const node of nodes) if (node.kind === "field") {
		const definition = fieldDefinition(fields, node.type);
		value[node.id] = definition === void 0 ? void 0 : initialFieldValue(definition);
	} else if (node.kind === "group") value[node.id] = initialScopeValue(node.nodes, fields);
	else if (node.kind === "collection") value[node.id] = [];
	else {
		const wizardValue = {};
		for (const stage of node.stages) wizardValue[stage.id] = initialScopeValue(stage.nodes, fields);
		value[node.id] = wizardValue;
	}
	return value;
}
function eventRecord(payload) {
	return payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : void 0;
}
function parseNodeAddress(value) {
	if (!Array.isArray(value)) return void 0;
	const address = [];
	for (const candidate of value) {
		const record = eventRecord(candidate);
		const kind = record?.["kind"];
		const id = record?.["id"];
		if (kind !== "node" && kind !== "row" || typeof id !== "string") return void 0;
		address.push({
			kind,
			id
		});
	}
	return address;
}
function parseCollectionCommand(node, event, fields, rowIndex) {
	if (node.config.kind !== "collection") return {
		code: "event.target-kind",
		message: "Collection event requires a collection target."
	};
	const payload = eventRecord(event.payload) ?? {};
	if (event.name === "collection:add") {
		const index = payload["index"];
		if (index !== void 0 && typeof index !== "number") return {
			code: "collection.payload",
			message: "Add index must be a number."
		};
		let item;
		if (Object.prototype.hasOwnProperty.call(payload, "value")) item = payload["value"];
		else if (node.config.variants !== void 0) {
			const variant = payload["variant"];
			if (typeof variant !== "string" || node.config.variants[variant] === void 0) return {
				code: "collection.variant",
				message: "Adding to a union collection requires a known variant."
			};
			const variantConfig = node.config.variants[variant];
			if (variantConfig === void 0) return {
				code: "collection.variant",
				message: "Unknown collection variant."
			};
			item = {
				...initialScopeValue(variantConfig.nodes, fields),
				[node.config.discriminator]: variant
			};
		} else item = initialScopeValue(node.config.nodes, fields);
		return { command: {
			name: "collection:add",
			item,
			...index === void 0 ? {} : { index }
		} };
	}
	if (event.name === "collection:remove") {
		const index = payload["index"] ?? rowIndex;
		return typeof index === "number" ? { command: {
			name: event.name,
			index
		} } : {
			code: "collection.payload",
			message: "Remove requires a numeric index."
		};
	}
	if (event.name === "collection:replace") {
		const index = payload["index"] ?? rowIndex;
		return typeof index === "number" && Object.prototype.hasOwnProperty.call(payload, "value") ? { command: {
			name: event.name,
			index,
			item: payload["value"]
		} } : {
			code: "collection.payload",
			message: "Replace requires an index and value."
		};
	}
	if (event.name === "collection:duplicate") {
		const index = payload["index"] ?? rowIndex;
		const toIndex = payload["toIndex"];
		return typeof index === "number" && (toIndex === void 0 || typeof toIndex === "number") ? { command: {
			name: event.name,
			index,
			...toIndex === void 0 ? {} : { toIndex }
		} } : {
			code: "collection.payload",
			message: "Duplicate requires numeric indexes."
		};
	}
	if (event.name === "collection:move") {
		const from = payload["from"] ?? rowIndex;
		return typeof from === "number" && typeof payload["to"] === "number" ? { command: {
			name: event.name,
			from,
			to: payload["to"]
		} } : {
			code: "collection.payload",
			message: "Move requires numeric from and to indexes."
		};
	}
	if (event.name === "collection:sort") {
		const order = payload["order"];
		return Array.isArray(order) && order.every((index) => typeof index === "number") ? { command: {
			name: event.name,
			order
		} } : {
			code: "collection.payload",
			message: "Sort requires a numeric order array."
		};
	}
	return {
		code: "collection.event",
		message: `Unknown collection event \"${event.name}\".`
	};
}
function mapSnapshotNode(node, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress) {
	const key = addressKey(node.address);
	const nodeIssues = issues.filter((issue) => pathsEqual(issue.path, node.path));
	const nodeVisibleIssues = visibleIssues.filter((issue) => pathsEqual(issue.path, node.path));
	if (node.config.kind === "field") {
		const definition = fieldDefinition(fields, node.config.type);
		const currentValue = getAtPath(value, node.path);
		const baselineValue = getAtPath(baseline, node.path);
		const initialValue = baselineValue === void 0 && definition !== void 0 ? initialFieldValue(definition) : baselineValue;
		return {
			kind: "field",
			id: node.config.id,
			type: node.config.type,
			view: definition?.view,
			path: node.path,
			address: node.address,
			value: currentValue,
			initialValue,
			props: node.props,
			state: {
				disabled: node.disabled,
				visible: node.visible,
				focused: interaction.focused.has(key),
				touched: interaction.touched.has(key),
				dirty: !deepEqual(currentValue, initialValue),
				validating: (validationByAddress.get(key)?.pendingCount ?? 0) > 0,
				issues: nodeIssues,
				visibleIssues: nodeVisibleIssues
			}
		};
	}
	return {
		kind: node.config.kind,
		id: node.config.id,
		path: node.path,
		address: node.address,
		state: {
			disabled: node.disabled,
			visible: node.visible
		},
		nodes: node.branches.length > 0 ? node.branches.filter((branch) => branch.visible).map((branch) => mapSnapshotBranch(branch, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress, node.config.kind === "wizard" ? interaction.activeWizards.get(addressKey(node.address)) === branch.id : void 0)) : node.children.filter((child) => child.visible).map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
		validation: validationByAddress.get(key) ?? emptyValidation,
		...node.config.kind === "collection" ? {
			size: Array.isArray(getAtPath(value, node.path)) ? getAtPath(value, node.path).length : 0,
			canAdd: !node.disabled && (node.config.max === void 0 || node.branches.length < node.config.max),
			canRemove: !node.disabled && (node.config.min === void 0 || node.branches.length > node.config.min)
		} : {},
		...node.config.kind === "wizard" ? (() => {
			const visibleStages = node.branches.filter((branch) => branch.visible);
			const activeStage = interaction.activeWizards.get(addressKey(node.address)) ?? visibleStages[0]?.id;
			const activeIndex = visibleStages.findIndex((branch) => branch.id === activeStage);
			return {
				...activeStage === void 0 ? {} : { activeStage },
				visibleStageIds: visibleStages.map((branch) => branch.id),
				canPrevious: !node.disabled && activeIndex > 0,
				canNext: !node.disabled && activeIndex >= 0 && activeIndex < visibleStages.length - 1,
				canGo: !node.disabled && node.config.navigation?.nonLinear === true
			};
		})() : {}
	};
}
function mapSnapshotBranch(branch, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress, active) {
	return {
		kind: branch.kind,
		id: branch.id,
		path: branch.path,
		address: branch.address,
		state: {
			disabled: branch.disabled,
			visible: branch.visible
		},
		nodes: branch.children.filter((child) => child.visible).map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
		validation: validationByAddress.get(addressKey(branch.address)) ?? emptyValidation,
		...active === void 0 ? {} : { active }
	};
}
function validatorsFor(nodes, fields, rootValidators = []) {
	const output = [];
	const root = {
		path: [],
		address: [],
		visible: true,
		disabled: false
	};
	for (const validator of rootValidators) output.push({
		node: root,
		validator,
		identity: validator,
		keyId: `config:${validator.id}`,
		intrinsic: false
	});
	for (const node of nodes) {
		for (const validator of node.config.validators ?? []) output.push({
			node,
			validator,
			identity: validator,
			keyId: `config:${validator.id}`,
			intrinsic: false
		});
		if (node.config.kind === "field") {
			const definition = fieldDefinition(fields, node.config.type);
			for (const fieldValidator of definition?.validators ?? []) {
				const intrinsicValidator = fieldValidator;
				const validator = {
					id: fieldValidator.id,
					on: [],
					validate: ({ fieldValue }) => intrinsicValidator.validate(fieldValue, node.props).map((issue) => ({
						...issue,
						path: node.path
					}))
				};
				output.push({
					node,
					validator,
					identity: fieldValidator,
					keyId: `field:${fieldValidator.id}`,
					intrinsic: true
				});
			}
		}
		output.push(...validatorsFor(node.children, fields));
	}
	return output;
}
function stages(options) {
	const restored = options.state === void 0 ? void 0 : migrateSerializedState(validateSerializedState(options.state), options.migrations ?? []);
	const decodeValue = (encoded) => options.codec === void 0 ? decodeJson(encoded) : options.codec.decode(encoded);
	const encodeValue = (decoded) => encodeJson(options.codec === void 0 ? decoded : options.codec.encode(decoded));
	let value = restored === void 0 ? options.value : decodeValue(restored.value);
	const baseline = restored === void 0 ? options.value : decodeValue(restored.baseline);
	let context = options.context;
	let schemaInput = options.schema;
	const extensionCodecs = options.extensionCodecs ?? {};
	const extensionCodec = (namespace) => Object.prototype.hasOwnProperty.call(extensionCodecs, namespace) ? extensionCodecs[namespace] : void 0;
	for (const [namespace, codec] of Object.entries(extensionCodecs)) {
		if (namespace.length === 0 || !isSafePathSegment(namespace)) throw new TypeError(`Invalid extension namespace "${namespace}".`);
		if (codec === null || typeof codec !== "object" || typeof codec.encode !== "function" || typeof codec.decode !== "function") throw new TypeError(`Extension namespace "${namespace}" requires encode and decode functions.`);
	}
	const extensionValues = (input) => {
		if (input === void 0) return {};
		if (input === null || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Extension state must be an object.");
		const output = {};
		for (const [namespace, extensionValue] of Object.entries(input)) {
			if (extensionCodec(namespace) === void 0) throw new TypeError(`Extension namespace "${namespace}" is not registered.`);
			output[namespace] = extensionValue;
		}
		return output;
	};
	let extensions = extensionValues(options.extensions);
	const serializedExtensions = restored?.meta["extensions"];
	if (serializedExtensions !== void 0) {
		const encoded = extensionValues(serializedExtensions);
		const decoded = { ...extensions };
		for (const [namespace, extensionValue] of Object.entries(encoded)) {
			const codec = extensionCodec(namespace);
			if (codec === void 0) throw new TypeError(`Extension namespace "${namespace}" is not registered.`);
			try {
				decoded[namespace] = codec.decode(extensionValue);
			} catch (error) {
				throw new SerializationError("extension.decode", `Extension namespace "${namespace}" failed to decode: ${error instanceof Error ? error.message : String(error)}`, [
					"meta",
					"extensions",
					namespace
				]);
			}
		}
		extensions = decoded;
	}
	let revision = 0;
	let transactionId = 0;
	let destroyed = false;
	let batchDepth = 0;
	let scheduled = false;
	let flushing = false;
	let dirtySnapshot = true;
	let proposal;
	let transactionEvents = [];
	let transactionPatches = [];
	let transactionSource = "user";
	let transactionCollectionKeys;
	let focused = /* @__PURE__ */ new Map();
	let touched = /* @__PURE__ */ new Map();
	let visited = /* @__PURE__ */ new Map();
	let revealedValidation = /* @__PURE__ */ new Map();
	let activeWizards = /* @__PURE__ */ new Map();
	let collectionKeys = /* @__PURE__ */ new Map();
	let rowKeyCounter = 0;
	let pendingAcceptance;
	if (restored !== void 0) {
		const serializedTouched = restored.meta["touched"];
		if (Array.isArray(serializedTouched)) for (const item of serializedTouched) {
			const address = parseNodeAddress(item);
			if (address !== void 0) touched.set(addressKey(address), address);
		}
		const serializedVisited = restored.meta["visited"];
		if (Array.isArray(serializedVisited)) for (const item of serializedVisited) {
			const address = parseNodeAddress(item);
			if (address !== void 0) visited.set(addressKey(address), address);
		}
		const serializedRevealedValidation = restored.meta["revealedValidation"];
		if (Array.isArray(serializedRevealedValidation)) for (const item of serializedRevealedValidation) {
			const address = parseNodeAddress(item);
			if (address !== void 0) revealedValidation.set(addressKey(address), address);
		}
		const serializedWizards = restored.meta["activeWizards"];
		if (Array.isArray(serializedWizards)) for (const item of serializedWizards) {
			if (!Array.isArray(item) || item.length !== 2 || typeof item[1] !== "string") continue;
			const address = parseNodeAddress(item[0]);
			if (address !== void 0) activeWizards.set(addressKey(address), {
				address,
				stage: item[1]
			});
		}
		const serializedCollectionKeys = restored.meta["collectionKeys"];
		if (Array.isArray(serializedCollectionKeys)) for (const item of serializedCollectionKeys) {
			if (!Array.isArray(item) || item.length !== 2 || !Array.isArray(item[1])) continue;
			const address = parseNodeAddress(item[0]);
			const keys = item[1];
			if (address !== void 0 && keys.every((key) => typeof key === "string")) collectionKeys.set(addressKey(address), {
				address,
				keys
			});
		}
	}
	let validation = emptyValidation;
	let validationRun = 0;
	let validationToken = 0;
	const validationRecords = /* @__PURE__ */ new Map();
	let publishedEvaluation;
	let transactionEvaluation;
	let lastValidEvaluation;
	let expectedSchemaIdentity;
	const listeners = /* @__PURE__ */ new Set();
	const selectorListeners = /* @__PURE__ */ new Set();
	const reportedDiagnostics = /* @__PURE__ */ new Set();
	let runtimeDiagnostics = [];
	let knownIdentities = /* @__PURE__ */ new Map();
	let cachedSnapshot;
	function meta() {
		return {
			revision,
			isDirty: !deepEqual(value, baseline),
			touched: [...touched.values()],
			visited: [...visited.values()],
			activeWizards: new Map([...activeWizards].map(([key, state]) => [key, state.stage])),
			extensions: readonlyValue(extensions)
		};
	}
	function reportRuntimeDiagnostic(code, message, path, address) {
		const item = {
			code,
			message,
			severity: "error",
			path,
			address
		};
		runtimeDiagnostics = [...runtimeDiagnostics.slice(-99), item];
		options.onDiagnostic?.(item);
	}
	function reportSchemaDiagnostic(item) {
		const key = `${item.code}:${JSON.stringify(item.path)}:${item.message}`;
		if (reportedDiagnostics.has(key)) return;
		reportedDiagnostics.add(key);
		options.onDiagnostic?.(item);
	}
	function validationFailureIssue(node, validatorId, event, kind, error) {
		const defaultCode = kind === "when" ? "validator-when-failed" : "validator-rejected";
		const fallback = {
			id: `${validatorId}.${kind === "when" ? "when-failed" : "rejected"}`,
			code: defaultCode,
			path: node.path,
			severity: "error",
			message: error instanceof Error ? error.message : String(error)
		};
		if (options.validationFailureIssue === void 0) return fallback;
		try {
			const candidate = eventRecord(options.validationFailureIssue({
				kind,
				validatorId,
				event,
				path: node.path,
				address: node.address,
				error
			}));
			const code = candidate?.["code"];
			const message = candidate?.["message"];
			const meta = candidate?.["meta"];
			if (candidate === void 0 || code !== void 0 && (typeof code !== "string" || code.length === 0) || message !== void 0 && typeof message !== "string" || meta !== void 0 && eventRecord(meta) === void 0) throw new TypeError("Validation failure issue presentation is malformed.");
			return {
				...fallback,
				...typeof code === "string" ? { code } : {},
				...typeof message === "string" ? { message } : {},
				...meta === void 0 ? {} : { meta }
			};
		} catch (factoryError) {
			reportRuntimeDiagnostic("validation.failure-issue-failed", `Validation failure issue factory failed: ${factoryError instanceof Error ? factoryError.message : String(factoryError)}`, node.path, node.address);
			return fallback;
		}
	}
	function evaluated(currentValue) {
		const currentCollectionKeys = transactionCollectionKeys ?? collectionKeys;
		let result;
		try {
			result = evaluateSchema({
				schema: schemaInput,
				value: readonlyValue(currentValue),
				context: readonlyValue(context),
				meta: meta(),
				fields: options.fields,
				collectionKeys: new Map([...currentCollectionKeys].map(([key, state]) => [key, state.keys]))
			});
		} catch (error) {
			if (lastValidEvaluation === void 0) throw error;
			const failure = {
				code: "schema.factory-failed",
				message: error instanceof Error ? error.message : String(error),
				severity: "error",
				path: [],
				address: []
			};
			reportSchemaDiagnostic(failure);
			return {
				schema: lastValidEvaluation.schema,
				nodes: lastValidEvaluation.nodes,
				diagnostics: [failure]
			};
		}
		const expectedIdentity = expectedSchemaIdentity;
		if (expectedIdentity !== void 0 && (result.schema.id !== expectedIdentity.id || result.schema.version !== expectedIdentity.version) && expectedIdentity !== void 0) {
			const failure = {
				code: "schema.identity-changed",
				message: `Schema factory changed root identity from ${expectedIdentity.id}@${expectedIdentity.version} to ${result.schema.id}@${result.schema.version}.`,
				severity: "error",
				path: [],
				address: []
			};
			result = {
				...result,
				diagnostics: [...result.diagnostics, failure]
			};
		}
		if (restored !== void 0 && (restored.format !== "stages" || restored.formatVersion !== 1 || restored.schema.id !== result.schema.id || restored.schema.version !== result.schema.version)) throw new TypeError(`Serialized state targets ${restored.schema.id}@${restored.schema.version}, not ${result.schema.id}@${result.schema.version}.`);
		for (const item of result.diagnostics) reportSchemaDiagnostic(item);
		if (result.diagnostics.some((item) => item.severity === "error") && lastValidEvaluation !== void 0) return {
			schema: lastValidEvaluation.schema,
			nodes: lastValidEvaluation.nodes,
			diagnostics: result.diagnostics
		};
		if (!result.diagnostics.some((item) => item.severity === "error")) {
			expectedSchemaIdentity ?? (expectedSchemaIdentity = {
				id: result.schema.id,
				version: result.schema.version
			});
			lastValidEvaluation = result;
		}
		return result;
	}
	function allocateRowKey(used) {
		let key;
		do {
			rowKeyCounter += 1;
			key = `row:${rowKeyCounter}`;
		} while (used.has(key));
		return key;
	}
	function synchronizeCollectionKeys(nodes, currentValue) {
		const synchronize = (items) => {
			for (const node of items) {
				if (node.config.kind === "collection" && node.config.itemKey === void 0) {
					const key = addressKey(node.address);
					const current = getAtPath(currentValue, node.path);
					const length = Array.isArray(current) ? current.length : 0;
					const keys = (collectionKeys.get(key)?.keys ?? node.branches.map((branch) => branch.id)).slice(0, length);
					const used = new Set(keys);
					while (keys.length < length) {
						const next = allocateRowKey(used);
						keys.push(next);
						used.add(next);
					}
					collectionKeys.set(key, {
						address: node.address,
						keys
					});
				}
				synchronize(node.children);
			}
		};
		synchronize(nodes);
	}
	function updateTransactionCollectionKeys(node, command) {
		if (node.config.kind !== "collection" || node.config.itemKey !== void 0) return;
		const key = addressKey(node.address);
		const keys = ((transactionCollectionKeys?.get(key) ?? collectionKeys.get(key))?.keys ?? node.branches.map((branch) => branch.id)).slice();
		const used = new Set(keys);
		if (command.name === "collection:add") keys.splice(command.index ?? keys.length, 0, allocateRowKey(used));
		else if (command.name === "collection:remove") keys.splice(command.index, 1);
		else if (command.name === "collection:duplicate") keys.splice(command.toIndex ?? command.index + 1, 0, allocateRowKey(used));
		else if (command.name === "collection:move") {
			const movedKey = keys.splice(command.from, 1)[0];
			if (movedKey !== void 0) keys.splice(command.to, 0, movedKey);
		} else if (command.name === "collection:sort") {
			const sorted = command.order.map((index) => keys[index]).filter((item) => item !== void 0);
			keys.splice(0, keys.length, ...sorted);
		}
		transactionCollectionKeys ?? (transactionCollectionKeys = new Map(collectionKeys));
		transactionCollectionKeys.set(key, {
			address: node.address,
			keys
		});
	}
	function reconcileInteraction(nodes) {
		const nextIdentities = /* @__PURE__ */ new Map([[addressKey([]), "root"]]);
		const nextIdentityNodes = /* @__PURE__ */ new Map();
		const collect = (items) => {
			for (const node of items) {
				const key = addressKey(node.address);
				const signature = node.config.kind === "field" ? `field:${node.config.type}` : node.config.kind;
				nextIdentities.set(key, signature);
				nextIdentityNodes.set(key, {
					path: node.path,
					address: node.address
				});
				collect(node.children);
			}
		};
		collect(nodes);
		for (const [key, nextIdentity] of nextIdentities) {
			const previousIdentity = knownIdentities.get(key);
			const node = nextIdentityNodes.get(key);
			if (previousIdentity !== void 0 && previousIdentity !== nextIdentity && node !== void 0) reportRuntimeDiagnostic("schema.incompatible-identity", `Node identity changed from "${previousIdentity}" to "${nextIdentity}" at the same address.`, node.path, node.address);
		}
		const retainCompatible = (entries) => {
			const retained = /* @__PURE__ */ new Map();
			for (const [key, address] of entries) {
				const previous = knownIdentities.get(key);
				const next = nextIdentities.get(key);
				if (next !== void 0 && (previous === void 0 || previous === next)) retained.set(key, address);
			}
			return retained;
		};
		focused = retainCompatible(focused);
		touched = retainCompatible(touched);
		visited = retainCompatible(visited);
		revealedValidation = retainCompatible(revealedValidation);
		const nextActiveWizards = /* @__PURE__ */ new Map();
		const initializeWizards = (items) => {
			for (const node of items) {
				if (node.config.kind === "wizard") {
					const key = addressKey(node.address);
					const visibleStages = node.branches.filter((branch) => branch.visible);
					const previous = activeWizards.get(key);
					const configured = node.config.initialStage;
					const stage = previous !== void 0 && visibleStages.some((branch) => branch.id === previous.stage) ? previous.stage : configured !== void 0 && visibleStages.some((branch) => branch.id === configured) ? configured : visibleStages[0]?.id;
					if (stage !== void 0) nextActiveWizards.set(key, {
						address: node.address,
						stage
					});
				}
				initializeWizards(node.children);
			}
		};
		initializeWizards(nodes);
		activeWizards = nextActiveWizards;
		synchronizeCollectionKeys(nodes, value);
		const retainedCollectionKeys = /* @__PURE__ */ new Map();
		for (const [key, state] of collectionKeys) if (nextIdentities.get(key) === "collection") retainedCollectionKeys.set(key, state);
		collectionKeys = retainedCollectionKeys;
		for (const [key, record] of validationRecords) {
			const identityKey = addressKey(record.address);
			const previousIdentity = knownIdentities.get(identityKey);
			const nextIdentity = nextIdentities.get(identityKey);
			if (nextIdentity === void 0 || previousIdentity !== void 0 && previousIdentity !== nextIdentity) {
				record.cancel();
				validationRecords.delete(key);
			}
		}
		knownIdentities = nextIdentities;
	}
	function validatorPaths(node, validator) {
		const paths = [node.path];
		for (const dependency of validator.dependencies ?? []) if (!paths.some((path) => pathsEqual(path, dependency))) paths.push(dependency);
		return paths;
	}
	function dependencyValues(paths, currentValue) {
		return paths.map((path) => getAtPath(currentValue, path));
	}
	function recordIsCurrent(record, node, validatorIdentity, currentValue) {
		return record.validator === validatorIdentity && record.context === context && record.dependencyValues.length === record.dependencyPaths.length && deepEqual(record.dependencyValues, dependencyValues(record.dependencyPaths, currentValue)) && pathsEqual(record.dependencyPaths[0] ?? [], node.path);
	}
	function validationContext(node, currentValue, event, signal = passiveValidationSignal) {
		const key = addressKey(node.address);
		return {
			value: readonlyValue(currentValue),
			context: readonlyValue(context),
			meta: meta(),
			path: node.path,
			address: node.address,
			fieldValue: getAtPath(currentValue, node.path),
			parentValue: getAtPath(currentValue, node.path.slice(0, -1)),
			event,
			signal,
			fieldState: {
				disabled: node.disabled,
				focused: focused.has(key),
				touched: touched.has(key),
				visited: visited.has(key)
			}
		};
	}
	function inValidationScope(node, scope) {
		if (scope === void 0 || scope === "form") return true;
		return "path" in scope ? pathsEqual(node.path.slice(0, scope.path.length), scope.path) : addressStartsWith(node.address, scope.address);
	}
	function deriveValidation(result, currentValue, scope = "form") {
		const issues = [];
		const visibleIssues = [];
		let pendingCount = 0;
		let unknownCount = 0;
		for (const { node, validator, identity, keyId } of validatorsFor(result.nodes, options.fields, result.schema.validators)) {
			if (!node.visible || node.disabled && validator.includeDisabled !== true || !inValidationScope(node, scope)) continue;
			const key = validationRecordKey(node.address, keyId);
			const record = validationRecords.get(key);
			let applicable = true;
			try {
				applicable = validator.when?.(validationContext(node, currentValue, "status")) !== false;
			} catch {
				applicable = true;
			}
			if (!applicable) {
				record?.cancel();
				validationRecords.delete(key);
				continue;
			}
			if (record === void 0) {
				unknownCount += 1;
				continue;
			}
			if (!recordIsCurrent(record, node, identity, currentValue)) {
				record.cancel();
				validationRecords.delete(key);
				unknownCount += 1;
				continue;
			}
			if (record.status === "pending") pendingCount += 1;
			issues.push(...record.issues);
			if (record.revealed) visibleIssues.push(...record.issues);
		}
		const status = issues.some((issue) => issue.severity === "error") ? "invalid" : pendingCount > 0 ? "pending" : unknownCount > 0 ? "unknown" : "valid";
		return {
			status,
			isValid: status === "valid",
			issues,
			visibleIssues,
			pendingCount,
			unknownCount
		};
	}
	function validationIndex(result, currentValue) {
		const index = /* @__PURE__ */ new Map();
		const collect = (nodes) => {
			for (const node of nodes) {
				index.set(addressKey(node.address), deriveValidation(result, currentValue, { address: node.address }));
				for (const branch of node.branches) index.set(addressKey(branch.address), deriveValidation(result, currentValue, { address: branch.address }));
				collect(node.children);
			}
		};
		collect(result.nodes);
		return index;
	}
	function runValidation(result, currentValue, event, force, reveal, scope = "form", targetAddress, affectedPaths = []) {
		const pending = [];
		for (const { node, validator, identity, keyId, intrinsic } of validatorsFor(result.nodes, options.fields, result.schema.validators)) {
			if (!node.visible || node.disabled && validator.includeDisabled !== true || !inValidationScope(node, scope)) continue;
			const key = validationRecordKey(node.address, keyId);
			const previous = validationRecords.get(key);
			const paths = validatorPaths(node, validator);
			if (!(force || targetAddress === void 0 || addressStartsWith(targetAddress, node.address) || paths.some((path) => affectedPaths.some((affected) => pathsIntersect(path, affected))))) continue;
			const revealRequested = reveal || eventNames(validator.revealOn).includes(event);
			const wasRevealed = revealedValidation.has(addressKey(node.address));
			const shouldRun = force || intrinsic || eventNames(validator.on).includes(event);
			const contextValue = validationContext(node, currentValue, event);
			let applicable = true;
			try {
				applicable = validator.when?.(contextValue) !== false;
			} catch (error) {
				if (revealRequested) revealedValidation.set(addressKey(node.address), node.address);
				previous?.cancel();
				validationRecords.set(key, {
					address: node.address,
					validator: identity,
					dependencyPaths: paths,
					dependencyValues: dependencyValues(paths, currentValue),
					context,
					status: "complete",
					issues: [validationFailureIssue(node, validator.id, event, "when", error)],
					revealed: revealRequested || wasRevealed || previous?.revealed === true,
					token: ++validationToken,
					cancel: () => void 0
				});
				continue;
			}
			if (!applicable) {
				previous?.cancel();
				validationRecords.delete(key);
				continue;
			}
			if (revealRequested) revealedValidation.set(addressKey(node.address), node.address);
			const shouldReveal = revealRequested || wasRevealed;
			if (!shouldRun) {
				if (shouldReveal && previous !== void 0) validationRecords.set(key, {
					...previous,
					revealed: true
				});
				continue;
			}
			const values = dependencyValues(paths, currentValue);
			const token = ++validationToken;
			const revealed = shouldReveal || previous?.revealed === true;
			previous?.cancel();
			const cancellation = createValidationCancellation();
			const runContext = validationContext(node, currentValue, event, cancellation.signal);
			try {
				const output = validator.validate(runContext);
				if (output !== null && typeof output === "object" && "then" in output) {
					validationRecords.set(key, {
						address: node.address,
						validator: identity,
						dependencyPaths: paths,
						dependencyValues: values,
						context,
						status: "pending",
						issues: previous !== void 0 && recordIsCurrent(previous, node, identity, currentValue) ? previous.issues : [],
						revealed,
						token,
						cancel: cancellation.cancel
					});
					const completion = Promise.resolve(output).then((issues) => checkedValidationIssues(issues)).catch((error) => [validationFailureIssue(node, validator.id, event, "validate", error)]).then((issues) => {
						if (destroyed) return;
						const record = validationRecords.get(key);
						const latestValue = proposal ?? value;
						if (record?.token !== token || !recordIsCurrent(record, node, identity, latestValue)) return;
						validationRecords.set(key, {
							...record,
							status: "complete",
							issues
						});
						revision += 1;
						dirtySnapshot = true;
						schedule();
					});
					pending.push(completion);
				} else validationRecords.set(key, {
					address: node.address,
					validator: identity,
					dependencyPaths: paths,
					dependencyValues: values,
					context,
					status: "complete",
					issues: checkedValidationIssues(output),
					revealed,
					token,
					cancel: cancellation.cancel
				});
			} catch (error) {
				validationRecords.set(key, {
					address: node.address,
					validator: identity,
					dependencyPaths: paths,
					dependencyValues: values,
					context,
					status: "complete",
					issues: [validationFailureIssue(node, validator.id, event, "validate", error)],
					revealed,
					token,
					cancel: cancellation.cancel
				});
			}
		}
		return Promise.all(pending).then(() => void 0);
	}
	function snapshot() {
		if (!dirtySnapshot) return cachedSnapshot;
		const result = evaluated(value);
		publishedEvaluation = result;
		reconcileInteraction(result.nodes);
		validation = deriveValidation(result, value);
		const indexedValidation = validationIndex(result, value);
		const previousNodes = indexSnapshotNodes(cachedSnapshot.nodes);
		const nextNodes = result.nodes.filter((node) => node.visible).map((node) => mapSnapshotNode(node, value, baseline, options.fields, {
			focused,
			touched,
			visited,
			activeWizards: new Map([...activeWizards].map(([key, state]) => [key, state.stage]))
		}, validation.issues, validation.visibleIssues, indexedValidation)).map((node) => shareSnapshotNode(node, previousNodes));
		cachedSnapshot = {
			value: readonlyValue(value),
			revision,
			nodes: nextNodes,
			validation,
			diagnostics: [...result.diagnostics, ...runtimeDiagnostics]
		};
		dirtySnapshot = false;
		return cachedSnapshot;
	}
	function notify() {
		dirtySnapshot = true;
		snapshot();
		for (const listener of [...listeners]) listener();
		for (const listener of [...selectorListeners]) listener();
	}
	function flush() {
		scheduled = false;
		if (destroyed) return;
		flushing = true;
		try {
			if (proposal !== void 0 && !Object.is(proposal, value)) {
				const next = proposal;
				const previousValue = value;
				const change = {
					value: next,
					previousValue,
					patches: transactionPatches,
					events: transactionEvents,
					source: transactionSource,
					transactionId: ++transactionId
				};
				if (transactionCollectionKeys !== void 0) pendingAcceptance = {
					proposedValue: next,
					previousValue,
					collectionKeys: new Map(transactionCollectionKeys)
				};
				else pendingAcceptance = void 0;
				proposal = void 0;
				transactionEvents = [];
				transactionPatches = [];
				options.onChange?.(change);
			} else {
				proposal = void 0;
				transactionEvents = [];
				transactionPatches = [];
			}
		} finally {
			flushing = false;
			transactionEvaluation = void 0;
			transactionCollectionKeys = void 0;
			transactionSource = "user";
		}
		notify();
	}
	function schedule() {
		dirtySnapshot = true;
		if (scheduled || batchDepth > 0 || destroyed) return;
		scheduled = true;
		Promise.resolve().then(flush);
	}
	function update(input) {
		if (destroyed) return;
		const invalidateAllValidation = input.context !== void 0 || input.schema !== void 0 || input.extensions !== void 0;
		if (input.value !== void 0) {
			if (pendingAcceptance !== void 0) {
				if (!deepEqual(input.value, pendingAcceptance.previousValue)) collectionKeys = new Map(pendingAcceptance.collectionKeys);
				pendingAcceptance = void 0;
			}
			value = input.value;
			if (publishedEvaluation !== void 0) synchronizeCollectionKeys(publishedEvaluation.nodes, value);
		}
		if (input.context !== void 0) context = input.context;
		if (input.extensions !== void 0) extensions = extensionValues(input.extensions);
		if (input.schema !== void 0) {
			schemaInput = input.schema;
			expectedSchemaIdentity = void 0;
		}
		publishedEvaluation = void 0;
		revision += 1;
		validationRun += 1;
		if (invalidateAllValidation) {
			for (const record of validationRecords.values()) record.cancel();
			validationRecords.clear();
		} else if (input.value !== void 0) {
			for (const [key, record] of validationRecords) if (!deepEqual(record.dependencyValues, dependencyValues(record.dependencyPaths, value))) {
				record.cancel();
				validationRecords.delete(key);
			}
		}
		validation = emptyValidation;
		dirtySnapshot = true;
		if (!flushing) schedule();
	}
	function dispatch(event) {
		if (destroyed) return;
		const draft = proposal ?? value;
		const previousTransactionCollectionKeys = transactionCollectionKeys === void 0 ? void 0 : new Map(transactionCollectionKeys);
		const result = transactionEvaluation ?? publishedEvaluation ?? evaluated(draft);
		transactionEvaluation = result;
		const allNodes = [];
		const collect = (nodes) => {
			for (const node of nodes) {
				allNodes.push(node);
				collect(node.children);
			}
		};
		collect(result.nodes);
		const addressedNode = event.target.kind === "field" ? allNodes.find((node) => node.config.kind === "field" && pathsEqual(node.path, event.target.kind === "field" ? event.target.path : [])) : event.target.kind === "node" ? allNodes.find((node) => addressKey(node.address) === addressKey(event.target.kind === "node" ? event.target.address : [])) : void 0;
		const eventTargetAddress = event.target.kind === "node" ? event.target.address : void 0;
		const rowTarget = addressedNode === void 0 && eventTargetAddress !== void 0 && event.name.startsWith("collection:") ? allNodes.filter((node) => node.config.kind === "collection").map((node) => ({
			node,
			rowIndex: node.branches.findIndex((branch) => addressKey(branch.address) === addressKey(eventTargetAddress))
		})).find(({ rowIndex }) => rowIndex >= 0) : void 0;
		const target = addressedNode ?? rowTarget?.node;
		let commandRejected = false;
		const isReset = event.name === "reset" && event.target.kind === "form";
		if (isReset) {
			transactionSource = "reset";
			focused.clear();
			touched.clear();
			visited.clear();
			revealedValidation.clear();
			activeWizards.clear();
			for (const record of validationRecords.values()) record.cancel();
			validationRecords.clear();
		}
		if (event.target.kind !== "form" && target === void 0) {
			commandRejected = event.name.startsWith("collection:") || event.name.startsWith("wizard:");
			reportRuntimeDiagnostic("event.target-missing", "Event target does not exist in the current schema.", event.target.kind === "field" ? event.target.path : [], event.target.kind === "node" ? event.target.address : []);
		}
		if (target !== void 0) {
			const key = addressKey(target.address);
			if (event.name === "focus") {
				focused = new Map(focused).set(key, target.address);
				visited = new Map(visited).set(key, target.address);
			} else if (event.name === "blur") {
				const nextFocused = new Map(focused);
				nextFocused.delete(key);
				focused = nextFocused;
				touched = new Map(touched).set(key, target.address);
			}
		}
		let patches = isReset ? [{
			op: "set",
			path: [],
			value: baseline
		}] : [];
		if (!isReset && target?.config.kind === "field" && target.visible && !target.disabled) {
			const definition = fieldDefinition(options.fields, target.config.type);
			try {
				const reduced = definition?.reduce?.({
					value: getAtPath(draft, target.path),
					event,
					path: target.path
				});
				if (reduced !== void 0) patches = "patches" in reduced ? reduced.patches : [{
					op: "set",
					path: target.path,
					value: reduced.value
				}];
			} catch (error) {
				commandRejected = true;
				reportRuntimeDiagnostic("field.reducer-failed", `Reducer for "${target.config.id}" failed: ${error instanceof Error ? error.message : String(error)}`, target.path, target.address);
			}
		} else if (target?.config.kind === "collection" && event.name.startsWith("collection:")) if (!target.visible || target.disabled) {
			commandRejected = true;
			reportRuntimeDiagnostic("collection.disabled", "Cannot change a hidden or disabled collection.", target.path, target.address);
		} else {
			const current = getAtPath(draft, target.path);
			if (!Array.isArray(current)) {
				commandRejected = true;
				reportRuntimeDiagnostic("collection.value", "Collection commands require an array value.", target.path, target.address);
			} else {
				const parsed = parseCollectionCommand(target, event, options.fields, rowTarget?.rowIndex);
				if ("command" in parsed) {
					const commandResult = reduceCollectionCommand(current, parsed.command, {
						...target.config.min === void 0 ? {} : { min: target.config.min },
						...target.config.max === void 0 ? {} : { max: target.config.max }
					});
					if (commandResult.accepted) {
						updateTransactionCollectionKeys(target, parsed.command);
						patches = [{
							op: "set",
							path: target.path,
							value: commandResult.value
						}];
					} else {
						commandRejected = true;
						reportRuntimeDiagnostic(commandResult.code, commandResult.message, target.path, target.address);
					}
				} else {
					commandRejected = true;
					reportRuntimeDiagnostic(parsed.code, parsed.message, target.path, target.address);
				}
			}
		}
		else if (target?.config.kind === "wizard" && event.name.startsWith("wizard:")) {
			const visibleStages = target.branches.filter((branch) => branch.visible);
			const key = addressKey(target.address);
			const currentStage = activeWizards.get(key)?.stage ?? visibleStages[0]?.id;
			const currentIndex = visibleStages.findIndex((branch) => branch.id === currentStage);
			const currentBranch = visibleStages[currentIndex];
			const currentStageValidation = currentBranch === void 0 ? emptyValidation : deriveValidation(result, draft, { address: currentBranch.address });
			let requestedStage;
			if (event.name === "wizard:next") requestedStage = visibleStages[currentIndex + 1]?.id;
			if (event.name === "wizard:previous") requestedStage = visibleStages[currentIndex - 1]?.id;
			if (event.name === "wizard:go") {
				const payload = eventRecord(event.payload);
				requestedStage = typeof event.payload === "string" ? event.payload : typeof payload?.["stage"] === "string" ? payload["stage"] : void 0;
			}
			let rejection;
			if (!target.visible || target.disabled) rejection = "Cannot navigate a hidden or disabled wizard.";
			else if (requestedStage === void 0 || !visibleStages.some((branch) => branch.id === requestedStage)) rejection = "Wizard target is not a visible stage.";
			else if (event.name === "wizard:go" && target.config.navigation?.nonLinear !== true) rejection = "Non-linear wizard navigation is disabled.";
			else if (target.config.navigation?.validateCurrent === true && currentStageValidation.status !== "valid") rejection = "Current wizard stage must be valid before navigation.";
			else if (currentStage !== void 0 && target.config.navigation?.guard !== void 0) try {
				if (!target.config.navigation.guard(readonlyValue(draft), currentStage, requestedStage)) rejection = "Wizard navigation guard rejected the target stage.";
			} catch (error) {
				rejection = `Wizard navigation guard failed: ${error instanceof Error ? error.message : String(error)}`;
			}
			if (rejection === void 0 && requestedStage !== void 0) activeWizards = new Map(activeWizards).set(key, {
				address: target.address,
				stage: requestedStage
			});
			else if (rejection !== void 0) {
				commandRejected = true;
				reportRuntimeDiagnostic("wizard.navigation-rejected", rejection, target.path, target.address);
			}
		}
		let nextDraft = draft;
		if (!commandRejected) try {
			nextDraft = applyPatches(draft, patches);
		} catch (error) {
			commandRejected = true;
			patches = [];
			reportRuntimeDiagnostic("event.patch-failed", `Event patches failed: ${error instanceof Error ? error.message : String(error)}`, target?.path ?? [], target?.address ?? []);
		}
		const matchingNodes = target === void 0 || commandRejected ? [] : allNodes.filter((node) => addressStartsWith(target.address, node.address)).sort((left, right) => right.address.length - left.address.length);
		const applyTransforms = (transforms, diagnosticPath, diagnosticAddress) => {
			for (const transform of transforms) {
				if (!(typeof transform.on === "string" ? [transform.on] : transform.on).includes(event.name)) continue;
				const transformContext = {
					value: readonlyValue(nextDraft),
					context: readonlyValue(context),
					meta: meta(),
					path: target?.path ?? [],
					address: target?.address ?? [],
					fieldValue: target === void 0 ? void 0 : getAtPath(nextDraft, target.path),
					parentValue: target === void 0 ? void 0 : getAtPath(nextDraft, target.path.slice(0, -1)),
					event
				};
				try {
					if (transform.when?.(transformContext) === false) continue;
					const derived = transform.apply(transformContext);
					nextDraft = applyPatches(nextDraft, derived);
					patches = [...patches, ...derived];
				} catch (error) {
					reportRuntimeDiagnostic("transform.failed", `Transform for event "${event.name}" failed: ${error instanceof Error ? error.message : String(error)}`, diagnosticPath, diagnosticAddress);
					return false;
				}
			}
			return true;
		};
		for (const node of matchingNodes) if (!applyTransforms(node.config.transforms ?? [], node.path, node.address)) {
			commandRejected = true;
			break;
		}
		if (!commandRejected && !applyTransforms(result.schema.transforms ?? [], [], [])) commandRejected = true;
		if (commandRejected) {
			nextDraft = draft;
			patches = [];
			transactionCollectionKeys = previousTransactionCollectionKeys;
		}
		if (!commandRejected) {
			runValidation(result, nextDraft, event.name, false, false, "form", target?.address, patches.map((patch) => patch.path));
			validation = deriveValidation(result, nextDraft);
		}
		if (!Object.is(nextDraft, draft)) proposal = nextDraft;
		transactionEvents.push(event);
		transactionPatches.push(...patches);
		revision += 1;
		schedule();
	}
	async function validate(validateOptions = {}) {
		if (destroyed) return validation;
		const run = ++validationRun;
		const result = publishedEvaluation ?? evaluated(value);
		const pending = runValidation(result, value, validateOptions.event ?? "validate", true, validateOptions.reveal === true, validateOptions.scope);
		validation = deriveValidation(result, value);
		dirtySnapshot = true;
		schedule();
		await pending;
		if (destroyed || run !== validationRun) return validation;
		const scopedValidation = deriveValidation(result, value, validateOptions.scope);
		validation = deriveValidation(result, value);
		revision += 1;
		schedule();
		return scopedValidation;
	}
	function serialize() {
		const current = snapshot();
		const evaluatedCurrent = publishedEvaluation ?? evaluated(value);
		const encodedExtensions = {};
		for (const [namespace, extensionValue] of Object.entries(extensions)) {
			const codec = extensionCodec(namespace);
			if (codec === void 0) throw new TypeError(`Extension namespace "${namespace}" is not registered.`);
			try {
				encodedExtensions[namespace] = encodeJson(codec.encode(readonlyValue(extensionValue)), [
					"meta",
					"extensions",
					namespace
				]);
			} catch (error) {
				if (error instanceof SerializationError) throw error;
				throw new SerializationError("extension.encode", `Extension namespace "${namespace}" failed to encode: ${error instanceof Error ? error.message : String(error)}`, [
					"meta",
					"extensions",
					namespace
				]);
			}
		}
		return {
			format: "stages",
			formatVersion: 1,
			schema: {
				id: evaluatedCurrent.schema.id,
				version: evaluatedCurrent.schema.version
			},
			value: encodeValue(current.value),
			baseline: encodeValue(readonlyValue(baseline)),
			meta: {
				touched: encodeJson([...touched.values()]),
				visited: encodeJson([...visited.values()]),
				revealedValidation: encodeJson([...revealedValidation.values()]),
				activeWizards: encodeJson([...activeWizards.values()].map((state) => [state.address, state.stage])),
				collectionKeys: encodeJson([...collectionKeys.values()].map((state) => [state.address, state.keys])),
				extensions: encodedExtensions
			}
		};
	}
	cachedSnapshot = {
		value: readonlyValue(value),
		revision,
		nodes: [],
		validation,
		diagnostics: []
	};
	snapshot();
	if (publishedEvaluation !== void 0) {
		runValidation(publishedEvaluation, value, "init", false, false);
		validation = deriveValidation(publishedEvaluation, value);
		dirtySnapshot = true;
		snapshot();
	}
	return {
		getSnapshot: snapshot,
		subscribe(listener) {
			if (destroyed) return () => void 0;
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		subscribeSelector(selector, listener, isEqual = Object.is) {
			if (destroyed) return () => void 0;
			let selected = selector(snapshot());
			const notifySelector = () => {
				const nextSelected = selector(snapshot());
				if (isEqual(selected, nextSelected)) return;
				const previousSelected = selected;
				selected = nextSelected;
				listener(nextSelected, previousSelected);
			};
			selectorListeners.add(notifySelector);
			return () => selectorListeners.delete(notifySelector);
		},
		update,
		dispatch,
		batch(run) {
			if (destroyed) return;
			batchDepth += 1;
			try {
				run();
			} finally {
				batchDepth -= 1;
				if (batchDepth === 0) schedule();
			}
		},
		validate,
		serialize,
		destroy() {
			destroyed = true;
			validationRun += 1;
			listeners.clear();
			selectorListeners.clear();
			activeWizards.clear();
			collectionKeys.clear();
			revealedValidation.clear();
			for (const record of validationRecords.values()) record.cancel();
			validationRecords.clear();
			proposal = void 0;
			transactionEvents = [];
			transactionPatches = [];
			transactionSource = "user";
			transactionEvaluation = void 0;
			transactionCollectionKeys = void 0;
			publishedEvaluation = void 0;
			lastValidEvaluation = void 0;
			pendingAcceptance = void 0;
		}
	};
}
//#endregion
//#region ../../packages/core/dist/events.js
function eventOptions(init) {
	return {
		...Object.prototype.hasOwnProperty.call(init, "payload") ? { payload: init.payload } : {},
		...init.source === void 0 ? {} : { source: init.source }
	};
}
function fieldEvent(name, path, init = {}) {
	return {
		name,
		target: {
			kind: "field",
			path
		},
		...eventOptions(init)
	};
}
function nodeEvent(name, address, init = {}) {
	return {
		name,
		target: {
			kind: "node",
			address
		},
		...eventOptions(init)
	};
}
function formEvent(name, init = {}) {
	return {
		name,
		target: { kind: "form" },
		...eventOptions(init)
	};
}
//#endregion
export { SerializationError, applyPatches, assertSafePath, decodeJson, encodeJson, evaluateSchema, fieldEvent, formEvent, getAtPath, initialFieldValue, isSafePathSegment, migrateSerializedState, nodeEvent, pathsEqual, reduceCollectionCommand, removeAtPath, setAtPath, stages, validateSerializedState };
