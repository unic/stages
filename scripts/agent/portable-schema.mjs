import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Emit the portable JSON shape from the authoritative TypeScript declarations.
// Graph references, supported capabilities and execution scopes remain semantic checks.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const configPath = path.join(root, 'packages/authoring/tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const source = program.getSourceFile(path.join(root, 'packages/authoring/src/portable.ts'));
const declaration = source.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'PortableFormDefinition');
const definitions = { JsonValue: { anyOf: [
  { type: ['string', 'number', 'boolean', 'null'] },
  { type: 'array', items: { $ref: '#/$defs/JsonValue' } },
  { type: 'object', additionalProperties: { $ref: '#/$defs/JsonValue' } },
] } };
const references = new Map();
const names = new Set(['JsonValue']);
function schema(type) {
  if (type.flags & ts.TypeFlags.Never) return false;
  if (type.aliasSymbol?.name === 'JsonValue') return { $ref: '#/$defs/JsonValue' };
  if (type.aliasSymbol?.name === 'Uid') return { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$', not: { enum: ['__proto__', 'prototype', 'constructor'] } };
  if (type.isStringLiteral()) return { const: type.value };
  if (type.isNumberLiteral()) return { const: type.value };
  if (type.flags & ts.TypeFlags.BooleanLiteral) return { const: type.intrinsicName === 'true' };
  if (type.flags & ts.TypeFlags.String) return { type: 'string' };
  if (type.flags & ts.TypeFlags.Number) return { type: 'number' };
  if (type.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };
  if (type.flags & ts.TypeFlags.Null) return { type: 'null' };
  if (type.isUnion()) return { anyOf: type.types.filter(item => !(item.flags & ts.TypeFlags.Undefined)).map(schema) };
  if (checker.isTupleType(type)) {
    const items = checker.getTypeArguments(type).map(schema);
    return { type: 'array', prefixItems: items, minItems: items.length, maxItems: items.length };
  }
  if (checker.isArrayType(type)) return { type: 'array', items: schema(checker.getTypeArguments(type)[0]) };
  if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) throw new Error(`Unsupported JSON type ${checker.typeToString(type)}`);
  if (references.has(type)) return { $ref: `#/$defs/${references.get(type)}` };
  let name = (type.aliasSymbol?.name ?? type.symbol?.name ?? 'Object').replace(/[^a-zA-Z0-9_]/g, '_');
  if (name === '__type') name = 'Object';
  const base = name;
  let suffix = 1;
  while (names.has(name)) name = `${base}_${suffix++}`;
  names.add(name);
  references.set(type, name);
  definitions[name] = {};
  const properties = {};
  const required = [];
  for (const property of checker.getPropertiesOfType(type)) {
    properties[property.name] = schema(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration ?? declaration));
    if (!(property.flags & ts.SymbolFlags.Optional)) required.push(property.name);
  }
  const index = checker.getIndexTypeOfType(type, ts.IndexKind.String) ?? checker.getIndexInfosOfType(type)[0]?.type;
  definitions[name] = { type: 'object', ...(required.length ? { required } : {}), ...(Object.keys(properties).length ? { properties } : {}), additionalProperties: index ? schema(index) : false };
  return { $ref: `#/$defs/${name}` };
}
const document = { $schema: 'https://json-schema.org/draft/2020-12/schema', title: 'Stages portable form v1', description: 'Structural schema. Also run validatePortableForm and loadPortableForm for graph, version, capability, binding, and scope checks.', ...schema(checker.getTypeAtLocation(declaration)), $defs: definitions };
const output = `${JSON.stringify(document, null, 2)}\n`;
const target = path.join(root, 'packages/authoring/portable.schema.json');
if (process.argv.includes('--update')) writeFileSync(target, output);
else if (readFileSync(target, 'utf8') !== output) throw new Error('Portable JSON Schema changed; run node scripts/agent/portable-schema.mjs --update and review the contract.');
