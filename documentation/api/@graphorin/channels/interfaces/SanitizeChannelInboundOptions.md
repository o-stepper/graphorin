[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / SanitizeChannelInboundOptions

# Interface: SanitizeChannelInboundOptions

Defined in: [packages/channels/src/inbound.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/inbound.ts#L27)

Options for [sanitizeChannelInbound](/api/@graphorin/channels/functions/sanitizeChannelInbound.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetms"></a> `budgetMs?` | `readonly` | `number` | Per-message scan budget in milliseconds (ReDoS ceiling). | [packages/channels/src/inbound.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/inbound.ts#L37) |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | Channel id recorded as the content origin on audit rows. | [packages/channels/src/inbound.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/inbound.ts#L29) |
| <a id="property-policy"></a> `policy?` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | Override the sanitization policy. Default `'detect-and-strip-and-wrap'` - the same default every other untrusted trust class gets. | [packages/channels/src/inbound.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/inbound.ts#L35) |
