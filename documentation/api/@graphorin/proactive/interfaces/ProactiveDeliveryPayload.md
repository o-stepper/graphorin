[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveDeliveryPayload

# Interface: ProactiveDeliveryPayload

Defined in: packages/proactive/src/ladder.ts:36

**`Stable`**

Structural mirror of `@graphorin/channels`' `DeliveryPayload` - what
`ChannelGateway.deliver(...)` accepts.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-identity"></a> `identity` | `readonly` | [`ProactiveDeliveryIdentity`](/api/@graphorin/proactive/interfaces/ProactiveDeliveryIdentity.md) | packages/proactive/src/ladder.ts:37 |
| <a id="property-question"></a> `question?` | `readonly` | \{ `options`: readonly \{ `label`: `string`; `value`: `string`; \}[]; `prompt`: `string`; `ref`: `string`; \} | packages/proactive/src/ladder.ts:39 |
| `question.options` | `readonly` | readonly \{ `label`: `string`; `value`: `string`; \}[] | packages/proactive/src/ladder.ts:41 |
| `question.prompt` | `readonly` | `string` | packages/proactive/src/ladder.ts:40 |
| `question.ref` | `readonly` | `string` | packages/proactive/src/ladder.ts:42 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/proactive/src/ladder.ts:38 |
