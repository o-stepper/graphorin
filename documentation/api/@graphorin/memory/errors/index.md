[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / errors

# errors

Typed error classes raised by `@graphorin/memory`. Every memory
subsystem throws one of these instead of plain `Error` so consumers
can pattern-match on `kind` and `name` without parsing the message.

## Classes

| Class | Description |
| ------ | ------ |
| [EmbedderMigrationAbortedError](/api/@graphorin/memory/errors/classes/EmbedderMigrationAbortedError.md) | Raised by `migrateEmbedder(...)` when the runner is interrupted via `AbortSignal`. The surrounding `for-await` loop receives this error so the operator can re-run the migration. There is no persisted cursor today, so a re-run restarts from the beginning. |
| [EmbedderMigrationLockedError](/api/@graphorin/memory/errors/classes/EmbedderMigrationLockedError.md) | Raised by the embedder migration runner when the operator attempts a silent embedder swap under the `lock-on-first` policy. |
| [EmbedderMigrationStateError](/api/@graphorin/memory/errors/classes/EmbedderMigrationStateError.md) | Raised by the migration runner when the migration references embedders that are no longer registered (e.g. the operator removed the underlying tables manually). |
| [EmbedderRegistrationError](/api/@graphorin/memory/errors/classes/EmbedderRegistrationError.md) | Raised when a memory write would reference an embedder that is not registered in the storage layer's `embedding_meta` registry. |
| [GraphorinMemoryError](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md) | Base class for every error raised by `@graphorin/memory`. Carries a stable lowercase `kind` discriminator and an optional `hint` surfaced to operators (CLI command / docs link to fix the issue). |
| [MemoryToolDeniedError](/api/@graphorin/memory/errors/classes/MemoryToolDeniedError.md) | Raised when a memory tool is invoked outside the per-tool ACL or the memory-modification guard tier rejects the call. |
| [ProcedureInductionNotConfiguredError](/api/@graphorin/memory/errors/classes/ProcedureInductionNotConfiguredError.md) | Raised when `ProceduralMemory.induce` is called but no workflow inducer was configured. Induction abstracts concrete values into variables, which needs a provider - so the capability is opt-in and the default (offline) procedural tier never silently no-ops a requested induction. |
| [QuarantinePromotionRefusedError](/api/@graphorin/memory/errors/classes/QuarantinePromotionRefusedError.md) | Raised by `SemanticMemory.validate` when a caller tries to promote a fact whose quarantine was triggered by the offline injection heuristics. Such a fact is a memory-poisoning candidate: the agent's own `fact_validate` tool must never be able to admit it into action-driving recall, so promotion is refused unless an operator passes the explicit `force` flag through the programmatic API. |
| [WorkingBlockOverflowError](/api/@graphorin/memory/errors/classes/WorkingBlockOverflowError.md) | Raised by `WorkingMemory` when a write would exceed the declared `charLimit` and the overflow policy is `'reject'`. |
| [WorkingBlockReadOnlyError](/api/@graphorin/memory/errors/classes/WorkingBlockReadOnlyError.md) | Thrown when any mutation targets a block defined with `readOnly: true`. Previously this guard threw `WorkingBlockReplaceMismatchError(label, 0)` - semantically "your unique substring matched 0 times", which misled callers that retry replace operations on mismatch. |
| [WorkingBlockReplaceMismatchError](/api/@graphorin/memory/errors/classes/WorkingBlockReplaceMismatchError.md) | Raised by `WorkingMemory.replace(...)` when the supplied unique substring is not present (or appears more than once) in the block value. |
