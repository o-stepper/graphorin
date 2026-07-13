[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictPipelineDeps

# Interface: ConflictPipelineDeps

Defined in: [packages/memory/src/conflict/types.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L213)

Per-call dependency bag handed to the pipeline by `SemanticMemory`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedder"></a> `embedder` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | - | [packages/memory/src/conflict/types.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L216) |
| <a id="property-embedderid"></a> `embedderId` | `readonly` | `string` \| `null` | - | [packages/memory/src/conflict/types.ts:217](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L217) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional cancellation signal forwarded to embedder + searchVector. | [packages/memory/src/conflict/types.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L219) |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | - | [packages/memory/src/conflict/types.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L214) |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | [packages/memory/src/conflict/types.ts:215](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L215) |
