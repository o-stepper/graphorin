[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / errors

# errors

Typed error classes raised by `@graphorin/memory`. Every memory
subsystem throws one of these instead of plain `Error` so consumers
can pattern-match on `kind` and `name` without parsing the message.

## Classes

| Class | Description |
| ------ | ------ |
| [EmbedderMigrationAbortedError](/api/@graphorin/memory/errors/classes/EmbedderMigrationAbortedError.md) | Raised by `migrateEmbedder(...)` when the runner is interrupted via `AbortSignal`. The surrounding `for-await` loop receives this error so the operator can resume from the persisted cursor on the next invocation. |
| [EmbedderMigrationLockedError](/api/@graphorin/memory/errors/classes/EmbedderMigrationLockedError.md) | Raised by the embedder migration runner when the operator attempts a silent embedder swap under the `lock-on-first` policy. |
| [EmbedderMigrationStateError](/api/@graphorin/memory/errors/classes/EmbedderMigrationStateError.md) | Raised by the migration runner when the persisted `migration_state` row references embedders that are no longer registered (e.g. the operator removed the underlying tables manually). |
| [EmbedderRegistrationError](/api/@graphorin/memory/errors/classes/EmbedderRegistrationError.md) | Raised when a memory write would reference an embedder that is not registered in the storage layer's `embedding_meta` registry. |
| [GraphorinMemoryError](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md) | Base class for every error raised by `@graphorin/memory`. Carries a stable lowercase `kind` discriminator and an optional `hint` surfaced to operators (CLI command / docs link to fix the issue). |
| [MemoryToolDeniedError](/api/@graphorin/memory/errors/classes/MemoryToolDeniedError.md) | Raised when a memory tool is invoked outside the per-tool ACL or the memory-modification guard tier rejects the call. |
| [WorkingBlockOverflowError](/api/@graphorin/memory/errors/classes/WorkingBlockOverflowError.md) | Raised by `WorkingMemory` when a write would exceed the declared `charLimit` and the overflow policy is `'reject'`. |
| [WorkingBlockReplaceMismatchError](/api/@graphorin/memory/errors/classes/WorkingBlockReplaceMismatchError.md) | Raised by `WorkingMemory.replace(...)` when the supplied unique substring is not present (or appears more than once) in the block value. |
