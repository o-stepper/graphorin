[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / DescribedFilter

# Interface: DescribedFilter()

Defined in: packages/agent/src/filters/index.ts:53

**`Stable`**

A `HandoffFilter` paired with the serializable descriptor that
round-trips through the JSONL session export. Authors of custom
filters return one of these via `filters.custom({...})`.

## Extends

- [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md)

```ts
DescribedFilter(history): readonly Message[];
```

Defined in: packages/agent/src/filters/index.ts:53

**`Stable`**

A `HandoffFilter` paired with the serializable descriptor that
round-trips through the JSONL session export. Authors of custom
filters return one of these via `filters.custom({...})`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `history` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |

## Returns

readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`HandoffInputFilterDescriptor`](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) | packages/agent/src/filters/index.ts:54 |
