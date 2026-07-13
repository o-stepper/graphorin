[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / DescribedFilter

# Interface: DescribedFilter()

Defined in: [packages/agent/src/filters/index.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L53)

A `HandoffFilter` paired with the serializable descriptor that
round-trips through the JSONL session export. Authors of custom
filters return one of these via `filters.custom({...})`.

## Stable

## Extends

- [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md)

```ts
DescribedFilter(history): readonly Message[];
```

Defined in: [packages/agent/src/filters/index.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L53)

A `HandoffFilter` paired with the serializable descriptor that
round-trips through the JSONL session export. Authors of custom
filters return one of these via `filters.custom({...})`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `history` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |

## Returns

readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`HandoffInputFilterDescriptor`](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) | [packages/agent/src/filters/index.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L54) |
