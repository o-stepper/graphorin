[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelInboundContext

# Interface: ChannelInboundContext

Defined in: [packages/channels/src/gateway.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L42)

Everything the application handler receives per authorized message.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deliver"></a> `deliver` | `readonly` | (`reply`) => `Promise`\&lt;[`DeliveryReceipt`](/api/@graphorin/channels/interfaces/DeliveryReceipt.md)\&gt; | Deliver an out-of-band message to the same peer (sanitized). | [packages/channels/src/gateway.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L57) |
| <a id="property-inboundtaint"></a> `inboundTaint` | `readonly` | \{ `sourceKind`: `string`; `text`: `string`; \} | Ready-made taint seed: pass as `AgentCallOptions.inboundTaint` so the run's data-flow ledger is armed before the first step. | [packages/channels/src/gateway.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L55) |
| `inboundTaint.sourceKind` | `readonly` | `string` | - | [packages/channels/src/gateway.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L55) |
| `inboundTaint.text` | `readonly` | `string` | - | [packages/channels/src/gateway.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L55) |
| <a id="property-message"></a> `message` | `readonly` | [`InboundChannelMessage`](/api/@graphorin/channels/interfaces/InboundChannelMessage.md) | The normalized inbound message (original, un-sanitized text). | [packages/channels/src/gateway.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L44) |
| <a id="property-route"></a> `route` | `readonly` | [`ResolvedChannelRoute`](/api/@graphorin/channels/interfaces/ResolvedChannelRoute.md) | Routing outcome: agent + session selector. | [packages/channels/src/gateway.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L50) |
| <a id="property-sanitization"></a> `sanitization` | `readonly` | [`SanitizationOutcome`](/api/@graphorin/channels/interfaces/SanitizationOutcome.md) | Full sanitization outcome (audit counters, pattern hits). | [packages/channels/src/gateway.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L48) |
| <a id="property-sanitizedtext"></a> `sanitizedText` | `readonly` | `string` | Sanitized text - feed THIS to the agent, never `message.text`. | [packages/channels/src/gateway.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L46) |
