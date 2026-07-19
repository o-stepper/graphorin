[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryToolDeps

# Interface: MemoryToolDeps

Defined in: packages/memory/src/tools/types.ts:29

**`Stable`**

Dependency bundle threaded into every memory tool. Exposed
separately from the `Tool` surface so the executor can scope
the dependencies per call without leaking the wider memory facade
into the tool author surface.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemory`](/api/@graphorin/memory/classes/EpisodicMemory.md) | packages/memory/src/tools/types.ts:32 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemory`](/api/@graphorin/memory/classes/ProceduralMemory.md) | packages/memory/src/tools/types.ts:34 |
| <a id="property-resolvescope"></a> `resolveScope` | `readonly` | [`ScopeResolver`](/api/@graphorin/memory/type-aliases/ScopeResolver.md) | packages/memory/src/tools/types.ts:36 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemory`](/api/@graphorin/memory/classes/SemanticMemory.md) | packages/memory/src/tools/types.ts:33 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemory`](/api/@graphorin/memory/classes/SessionMemory.md) | packages/memory/src/tools/types.ts:31 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemory`](/api/@graphorin/memory/classes/SharedMemory.md) | packages/memory/src/tools/types.ts:35 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemory`](/api/@graphorin/memory/classes/WorkingMemory.md) | packages/memory/src/tools/types.ts:30 |
