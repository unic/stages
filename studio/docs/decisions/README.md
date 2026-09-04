# Stages Studio architecture decisions

These accepted decisions govern the v1-native Studio implementation. They are
application decisions: they do not change the public `@stages/*` contracts.
Supersede an ADR with a new record instead of rewriting its outcome silently.

| ADR | Decision |
| --- | --- |
| [0001](./0001-declarative-document-is-the-source.md) | The declarative Studio document is the editable source |
| [0002](./0002-editor-uids-and-runtime-ids.md) | Editor UIDs and runtime IDs have separate identities |
| [0003](./0003-safe-expressions-and-trusted-bindings.md) | Shared documents use safe expressions and named trusted bindings |
| [0004](./0004-compiler-source-maps.md) | Compilation emits bidirectional source maps |
| [0005](./0005-command-engine-and-history.md) | Every document edit is an immutable command |
| [0006](./0006-state-ownership.md) | Durable, workbench, history, preview, runtime, and platform state are separate |
| [0007](./0007-project-repository-boundary.md) | Persistence is accessed through a repository port |
| [0008](./0008-legacy-isolation.md) | Legacy configuration is accepted only at the importer boundary |
| [0009](./0009-retain-pages-router-during-vertical-slice.md) | Retain the Pages Router through the first vertical slice |

Product-level constraints are recorded in [Studio product gates](../PRODUCT_GATES.md).
