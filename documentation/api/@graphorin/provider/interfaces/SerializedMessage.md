[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / SerializedMessage

# Interface: SerializedMessage

Defined in: packages/provider/src/counters/serialize.ts:17

**`Internal`**

Plain-text projection of a [Message](/api/@graphorin/core/type-aliases/Message.md). The shape is what the
counter actually feeds the tokenizer.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-role"></a> `role` | `readonly` | `string` | packages/provider/src/counters/serialize.ts:18 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/provider/src/counters/serialize.ts:19 |
| <a id="property-toolcalls"></a> `toolCalls` | `readonly` | readonly \{ `args`: `string`; `name`: `string`; \}[] | packages/provider/src/counters/serialize.ts:20 |
