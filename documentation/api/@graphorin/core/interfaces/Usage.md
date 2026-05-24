[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Usage

# Interface: Usage

Defined in: packages/core/src/types/usage.ts:10

Token / cost metrics for a single LLM call.

`cost` is optional because the framework cannot compute it without a
pricing snapshot — providers/middleware fill it in (e.g. through the
separate `@graphorin/pricing` package) when the snapshot is available.

## Stable

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | packages/core/src/types/usage.ts:12 |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | packages/core/src/types/usage.ts:15 |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | packages/core/src/types/usage.ts:11 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | packages/core/src/types/usage.ts:13 |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | packages/core/src/types/usage.ts:14 |
