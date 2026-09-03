import {
  reduceCollectionCommand,
  type CollectionCommand,
  type CollectionCommandResult,
} from "@stages/core";

// source:start pure-collection-commands
const source = Object.freeze([
  Object.freeze({ id: "a" }),
  Object.freeze({ id: "b" }),
]);

const commands: readonly CollectionCommand[] = [
  { name: "collection:add", item: { id: "c" }, index: 1 },
  { name: "collection:remove", index: 0 },
  { name: "collection:replace", index: 1, item: { id: "replacement" } },
  { name: "collection:duplicate", index: 0, toIndex: 2 },
  { name: "collection:move", from: 0, to: 1 },
  { name: "collection:sort", order: [1, 0] },
];

const result: CollectionCommandResult = reduceCollectionCommand(
  source,
  commands[0]!,
  { min: 1, max: 4 },
);

if (result.accepted) {
  console.log(result.value); // [{ id: "a" }, { id: "c" }, { id: "b" }]
} else {
  console.warn(result.code, result.message);
}

// The source array is unchanged; accepted results are new shallow arrays.
console.log(source); // [{ id: "a" }, { id: "b" }]
// source:end pure-collection-commands

void commands;
