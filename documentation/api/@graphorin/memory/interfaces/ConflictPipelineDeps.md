[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictPipelineDeps

# Interface: ConflictPipelineDeps

Defined in: packages/memory/src/conflict/types.ts:213

**`Stable`**

Per-call dependency bag handed to the pipeline by `SemanticMemory`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedder"></a> `embedder` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | - | packages/memory/src/conflict/types.ts:216 |
| <a id="property-embedderid"></a> `embedderId` | `readonly` | `string` \| `null` | - | packages/memory/src/conflict/types.ts:217 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional cancellation signal forwarded to embedder + searchVector. | packages/memory/src/conflict/types.ts:219 |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | - | packages/memory/src/conflict/types.ts:214 |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/memory/src/conflict/types.ts:215 |
