[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / InboundAcceptance

# Interface: InboundAcceptance

Defined in: packages/channels/src/spi.ts:114

**`Stable`**

Result of handing an inbound message to the gateway. Adapters use
the rejection reasons to react at the transport level (e.g. slow a
poller down on `'queue-full'`).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-accepted"></a> `accepted` | `readonly` | `boolean` | - | packages/channels/src/spi.ts:115 |
| <a id="property-reason"></a> `reason?` | `readonly` | `"queue-full"` \| `"stopped"` | Present when `accepted` is false. | packages/channels/src/spi.ts:117 |
