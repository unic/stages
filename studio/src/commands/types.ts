import type {
  StudioCollectionNode,
  StudioGroupNode,
  StudioNode,
  StudioProjectDocument,
  StudioStageNode,
  Uid,
} from "../document";

export type StudioNodeChanges = Readonly<Record<string, unknown>>;

export type StudioCommand =
  | {
    readonly type: "node.insert";
    readonly formUid: Uid;
    readonly parentUid: Uid | null;
    readonly index: number;
    readonly node: StudioNode;
  }
  | {
    readonly type: "node.insert-subtree";
    readonly formUid: Uid;
    readonly parentUid: Uid | null;
    readonly index: number;
    readonly rootUids: readonly Uid[];
    readonly nodes: Readonly<Record<Uid, StudioNode>>;
  }
  | { readonly type: "node.delete"; readonly formUid: Uid; readonly uid: Uid }
  | {
    readonly type: "node.update";
    readonly formUid: Uid;
    readonly uid: Uid;
    readonly changes: StudioNodeChanges;
  }
  | {
    readonly type: "node.move";
    readonly formUid: Uid;
    readonly uid: Uid;
    readonly parentUid: Uid | null;
    /** Index in the destination after the moved node has been removed. */
    readonly index: number;
  }
  | {
    readonly type: "node.duplicate";
    readonly formUid: Uid;
    readonly uid: Uid;
    readonly parentUid: Uid | null;
    readonly index: number;
    /** A complete old-to-new UID mapping for the copied subtree. */
    readonly uidMap: Readonly<Record<Uid, Uid>>;
    /** Optional runtime ID replacement for the copied subtree root. */
    readonly rootRuntimeId?: string;
  }
  | {
    readonly type: "node.wrap";
    readonly formUid: Uid;
    /** Nodes must be contiguous siblings and are kept in their current order. */
    readonly uids: readonly Uid[];
    readonly wrapper: StudioGroupNode | StudioCollectionNode;
  }
  | { readonly type: "node.unwrap"; readonly formUid: Uid; readonly uid: Uid }
  | {
    readonly type: "node.convert";
    readonly formUid: Uid;
    readonly uid: Uid;
    readonly targetKind: "collection" | "group" | "wizard";
    /** Required when converting a group or collection to a wizard. */
    readonly stage?: StudioStageNode;
    readonly collection?: {
      readonly min?: number;
      readonly max?: number;
      readonly initialRows?: number;
    };
  }
  | {
    readonly type: "transaction";
    readonly label: string;
    readonly commands: readonly StudioCommand[];
  };

export type StudioCommandFailureCode =
  | "command.empty-transaction"
  | "command.form-not-found"
  | "command.index-out-of-bounds"
  | "command.invalid-parent"
  | "command.invalid-uid-map"
  | "command.invalid-update"
  | "command.invariant"
  | "command.incompatible-placement"
  | "command.node-not-found"
  | "command.non-contiguous-selection"
  | "command.unresolved-clipboard-dependency"
  | "command.uid-conflict";

export interface StudioCommandFailure {
  readonly code: StudioCommandFailureCode;
  readonly message: string;
  readonly commandPath: readonly number[];
  readonly formUid?: Uid;
  readonly entityUid?: Uid;
}

export type StudioCommandResult =
  | {
    readonly ok: true;
    readonly document: StudioProjectDocument;
    readonly affectedUids: readonly Uid[];
    readonly changed: boolean;
  }
  | { readonly ok: false; readonly failure: StudioCommandFailure };

export interface StudioHistoryEntry {
  readonly label: string;
  readonly before: StudioProjectDocument;
  readonly after: StudioProjectDocument;
  readonly beforeRevision: number;
  readonly afterRevision: number;
  readonly affectedUids: readonly Uid[];
  readonly coalesceKey?: string;
}

export interface StudioHistoryState {
  readonly present: StudioProjectDocument;
  readonly past: readonly StudioHistoryEntry[];
  readonly future: readonly StudioHistoryEntry[];
  readonly revision: number;
  readonly savedRevision: number;
  readonly nextRevision: number;
  readonly maxCheckpoints: number;
}

export interface StudioHistoryDispatchOptions {
  readonly label?: string;
  /** Only consecutive edits with the same explicit key may coalesce. */
  readonly coalesceKey?: string;
}

export type StudioHistoryResult =
  | { readonly ok: true; readonly history: StudioHistoryState; readonly affectedUids: readonly Uid[]; readonly changed: boolean }
  | { readonly ok: false; readonly history: StudioHistoryState; readonly failure: StudioCommandFailure };
