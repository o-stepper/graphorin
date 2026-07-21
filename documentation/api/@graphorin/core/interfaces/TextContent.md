[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TextContent

# Interface: TextContent

Defined in: packages/core/src/types/message.ts:25

**`Stable`**

Plain UTF-8 text part. The default for textual replies and tool I/O.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | Optional opaque trace of the agent-runtime decisions that produced this content part. Bounded-length, no PII, no secret values. Round-tripped bytes-equal through `Session.push / list / export / import`. See `@graphorin/sessions` commentary-phase sanitization. | packages/core/src/types/message.ts:34 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/core/src/types/message.ts:27 |
| <a id="property-type"></a> `type` | `readonly` | `"text"` | - | packages/core/src/types/message.ts:26 |
