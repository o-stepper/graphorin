[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / HookDeps

# Interface: HookDeps

Defined in: packages/memory/src/context-engine/compaction/hooks/types.ts:30

**`Stable`**

Resolved dependency surface every built-in hook reads. Threaded
through Phase 12's lifecycle; tests pass a fixture
implementation.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowsensitivity"></a> `allowSensitivity?` | `readonly` | (`sensitivity`) => `boolean` | Privacy evaluator threaded from the engine's resolved privacy config. `true` = the provider may see content of this sensitivity. Built-in hooks MUST consult it before re-injecting tier content: `assemble()` filters what ships to the provider, and the post-compaction splice ships to the SAME provider - without the check, a `secret`-tier persona block / rule / pinned fact that the assembly correctly withheld leaks on the first compaction. Absent (operator-built HookDeps) means no filtering; the engine always supplies one. | packages/memory/src/context-engine/compaction/hooks/types.ts:46 |
| <a id="property-memory"></a> `memory` | `readonly` | [`Memory`](/api/@graphorin/memory/interfaces/Memory.md) | - | packages/memory/src/context-engine/compaction/hooks/types.ts:31 |
| <a id="property-procedural"></a> `procedural?` | `readonly` | \{ `tags?`: readonly `string`[]; `topic?`: `string`; \} | Optional context tags surfaced to the procedural-rules query. | packages/memory/src/context-engine/compaction/hooks/types.ts:34 |
| `procedural.tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/context-engine/compaction/hooks/types.ts:34 |
| `procedural.topic?` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/hooks/types.ts:34 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/context-engine/compaction/hooks/types.ts:32 |
