[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / DeliveryQuestion

# Interface: DeliveryQuestion

Defined in: [packages/channels/src/spi.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L148)

An interactive question rendered on the channel (HITL surface).
`ref` is the opaque resolve reference the application posts back
to the framework: either a serialized workflow awakeable address
(`serializeAwakeableRef` from `@graphorin/workflow`) or an agent
approval id. Rendering (buttons, quick replies, plain text) is the
adapter's choice.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-options"></a> `options` | `readonly` | readonly \{ `label`: `string`; `value`: `string`; \}[] | [packages/channels/src/spi.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L150) |
| <a id="property-prompt"></a> `prompt` | `readonly` | `string` | [packages/channels/src/spi.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L149) |
| <a id="property-ref"></a> `ref` | `readonly` | `string` | [packages/channels/src/spi.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L151) |
