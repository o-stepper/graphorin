[**Graphorin API reference v0.3.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / AISDKChunk

# Interface: AISDKChunk

Defined in: packages/provider/src/adapters/vercel.ts:66

Loose chunk shape emitted by the AI SDK's `streamText`. The shape is
intentionally permissive — we accept anything that carries the
fields we use and ignore the rest. This keeps the adapter tolerant
of additive AI SDK schema changes.

The fields we read are normalized in the adapter via narrow helper
functions, so we deliberately type each as `unknown` and gate
access behind `typeof` checks at runtime.

## Stable

## Indexable

```ts
[extra: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `readonly` | `string` | packages/provider/src/adapters/vercel.ts:67 |
