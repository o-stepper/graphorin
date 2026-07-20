[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Usage

# Interface: Usage

Defined in: packages/core/src/types/usage.ts:10

**`Stable`**

Token / cost metrics for a single LLM call.

`cost` is optional because the framework cannot compute it without a
pricing snapshot - providers/middleware fill it in (e.g. through the
separate `@graphorin/pricing` package) when the snapshot is available.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `number` | Prompt tokens served from the provider's prompt cache (a subset of `promptTokens`), billed at the discounted cache-read rate. | packages/core/src/types/usage.ts:29 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `number` | Prompt tokens written to the provider's prompt cache this call (a subset of `promptTokens`), billed at the cache-write premium where the provider charges one (Anthropic does; OpenAI does not report writes). | packages/core/src/types/usage.ts:35 |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | - | packages/core/src/types/usage.ts:17 |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | - | packages/core/src/types/usage.ts:37 |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | Total input tokens for the call, INCLUDING any prompt-cache reads and writes (`cachedReadTokens` / `cacheWriteTokens` are informational subsets, not additions). This matches the context size the model saw. | packages/core/src/types/usage.ts:16 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | Reasoning tokens billed IN ADDITION to `completionTokens` (exclusive; adapters that receive an inclusive total split it so the sum stays exact). Cost formulas may add this to the output leg without double-counting. | packages/core/src/types/usage.ts:24 |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | - | packages/core/src/types/usage.ts:36 |
