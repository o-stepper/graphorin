[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EmbedOptions

# Interface: EmbedOptions

Defined in: [packages/core/src/contracts/embedder.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/embedder.ts#L30)

Per-call options for `EmbedderProvider.embed(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-requestid"></a> `requestId?` | `readonly` | `string` | Optional per-call request id forwarded to the trace span. | [packages/core/src/contracts/embedder.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/embedder.ts#L33) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/core/src/contracts/embedder.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/embedder.ts#L31) |
| <a id="property-tasktype"></a> `taskType?` | `readonly` | `"query"` \| `"passage"` | Asymmetric retrieval role of the input (PS-10). Embedders for models that require asymmetric prefixes - the E5 family's `query:` / `passage:` - apply the matching prefix; embedders for symmetric models ignore it. Memory tiers pass `'query'` when embedding a search query and `'passage'` when embedding content for storage. | [packages/core/src/contracts/embedder.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/embedder.ts#L41) |
