export type CollectionCommand =
  | Readonly<{ name: "collection:add"; item: unknown; index?: number }>
  | Readonly<{ name: "collection:remove"; index: number }>
  | Readonly<{ name: "collection:replace"; index: number; item: unknown }>
  | Readonly<{ name: "collection:duplicate"; index: number; toIndex?: number }>
  | Readonly<{ name: "collection:move"; from: number; to: number }>
  | Readonly<{ name: "collection:sort"; order: readonly number[] }>;

export type CollectionCommandResult =
  | Readonly<{ accepted: true; value: readonly unknown[] }>
  | Readonly<{ accepted: false; code: string; message: string }>;

function validInsertionIndex(index: number, length: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index <= length;
}

function validItemIndex(index: number, length: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < length;
}

function reject(code: string, message: string): CollectionCommandResult {
  return { accepted: false, code, message };
}

export function reduceCollectionCommand(
  current: readonly unknown[],
  command: CollectionCommand,
  constraints: Readonly<{ min?: number; max?: number }> = {},
): CollectionCommandResult {
  if (command.name === "collection:add") {
    if (constraints.max !== undefined && current.length >= constraints.max) {
      return reject("collection.max", `Collection already contains the maximum of ${constraints.max} items.`);
    }
    const index = command.index ?? current.length;
    if (!validInsertionIndex(index, current.length)) return reject("collection.index", `Invalid insertion index ${index}.`);
    const next = current.slice();
    next.splice(index, 0, command.item);
    return { accepted: true, value: next };
  }

  if (command.name === "collection:remove") {
    if (constraints.min !== undefined && current.length <= constraints.min) {
      return reject("collection.min", `Collection must retain at least ${constraints.min} items.`);
    }
    if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
    const next = current.slice();
    next.splice(command.index, 1);
    return { accepted: true, value: next };
  }

  if (command.name === "collection:replace") {
    if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
    if (Object.is(current[command.index], command.item)) return reject("collection.unchanged", "Replacement item is unchanged.");
    const next = current.slice();
    next[command.index] = command.item;
    return { accepted: true, value: next };
  }

  if (command.name === "collection:duplicate") {
    if (constraints.max !== undefined && current.length >= constraints.max) {
      return reject("collection.max", `Collection already contains the maximum of ${constraints.max} items.`);
    }
    if (!validItemIndex(command.index, current.length)) return reject("collection.index", `Invalid item index ${command.index}.`);
    const toIndex = command.toIndex ?? command.index + 1;
    if (!validInsertionIndex(toIndex, current.length)) return reject("collection.index", `Invalid insertion index ${toIndex}.`);
    const next = current.slice();
    next.splice(toIndex, 0, current[command.index]);
    return { accepted: true, value: next };
  }

  if (command.name === "collection:move") {
    if (!validItemIndex(command.from, current.length) || !validItemIndex(command.to, current.length)) {
      return reject("collection.index", `Invalid move from ${command.from} to ${command.to}.`);
    }
    if (command.from === command.to) return reject("collection.unchanged", "Move source and destination are equal.");
    const next = current.slice();
    const removed = next.splice(command.from, 1);
    next.splice(command.to, 0, removed[0]);
    return { accepted: true, value: next };
  }

  if (command.order.length !== current.length) {
    return reject("collection.order", "Sort order must contain every collection index exactly once.");
  }
  const indexes = new Set(command.order);
  if (indexes.size !== current.length || command.order.some((index) => !validItemIndex(index, current.length))) {
    return reject("collection.order", "Sort order must be a permutation of collection indexes.");
  }
  if (command.order.every((index, position) => index === position)) {
    return reject("collection.unchanged", "Sort order is unchanged.");
  }
  return { accepted: true, value: command.order.map((index) => current[index]) };
}
