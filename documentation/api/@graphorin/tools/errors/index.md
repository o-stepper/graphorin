[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / errors

# errors

Typed error classes for `@graphorin/tools`.

Every error carries a lowercase `kind` discriminator and (where
relevant) a human-readable `hint` field surfaced in CLI output. Never
throw plain `Error` from framework code - the runtime depends on the
`kind` discriminator to drive recovery / replay logic.

## Classes

| Class | Description |
| ------ | ------ |
| [DuplicateToolNameError](/api/@graphorin/tools/errors/classes/DuplicateToolNameError.md) | Thrown when two registrations collide on the no-arguments `ToolRegistry.assertNoDuplicates()` signature. First-party / inline `tool({...})` collisions are programming errors that fail-fast. |
| [GraphorinToolsError](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md) | Common base for every `@graphorin/tools` error. |
| [InvalidExampleError](/api/@graphorin/tools/errors/classes/InvalidExampleError.md) | Thrown when an `examples` entry fails the registration-time Zod validation against the tool's `inputSchema` / `outputSchema`. |
| [InvalidPreferredModelError](/api/@graphorin/tools/errors/classes/InvalidPreferredModelError.md) | Thrown when a tool's `preferredModel` field does not parse as a `ModelHint` literal OR a structurally-valid `ModelSpec`. |
| [InvalidSideEffectClassError](/api/@graphorin/tools/errors/classes/InvalidSideEffectClassError.md) | Thrown when a tool declares a `sideEffectClass` value outside the canonical four-value union. The TypeScript type system catches this at compile time; the runtime check is the second line of defence for projects that bypass type-checking. |
| [ToolCollisionError](/api/@graphorin/tools/errors/classes/ToolCollisionError.md) | Thrown by the strategy-aware `ToolRegistry.assertNoDuplicates(...)` overload when the operator selected the `'manual'` strategy and the dispatcher has no automatic resolution path. |
| [ToolExecutionAggregateError](/api/@graphorin/tools/errors/classes/ToolExecutionAggregateError.md) | Thrown when an aggregate parallel batch fails. Carries every per-tool failure for observability + structured retry. |
