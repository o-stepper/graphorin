[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ResolveReasoningRetentionInput

# Interface: ResolveReasoningRetentionInput

Defined in: packages/provider/src/reasoning/retention.ts:35

Inputs to [resolveReasoningRetention](/api/@graphorin/provider/functions/resolveReasoningRetention.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contract"></a> `contract?` | `readonly` | [`ReasoningContract`](/api/@graphorin/core/type-aliases/ReasoningContract.md) | Adapter-declared capability (lowest precedence). | packages/provider/src/reasoning/retention.ts:41 |
| <a id="property-overridden"></a> `overridden?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Instance-level override supplied to `createProvider({...})`. | packages/provider/src/reasoning/retention.ts:39 |
| <a id="property-requested"></a> `requested?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Explicit per-request override (highest precedence). | packages/provider/src/reasoning/retention.ts:37 |
