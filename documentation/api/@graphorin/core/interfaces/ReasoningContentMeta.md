[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ReasoningContentMeta

# Interface: ReasoningContentMeta

Defined in: packages/core/src/types/message.ts:115

Opaque metadata round-tripped on `ReasoningContent`. Adapter-defined
keys; consumers must NOT introspect or modify the contents.

## Stable

## Indexable

```ts
[extraKey: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data?` | `readonly` | `string` | packages/core/src/types/message.ts:118 |
| <a id="property-provider"></a> `provider?` | `readonly` | `string` | packages/core/src/types/message.ts:116 |
| <a id="property-signature"></a> `signature?` | `readonly` | `string` | packages/core/src/types/message.ts:117 |
