[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / BareEventFrame

# Interface: BareEventFrame

Defined in: packages/server/src/ws/dispatcher.ts:199

**`Stable`**

Frame argument accepted by [WsDispatcher.emit](/api/@graphorin/server/interfaces/WsDispatcher.md#emit). The
dispatcher fills in `subscriptionId`, `subject`, and `eventId`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-eventid"></a> `eventId?` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:202 |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | packages/server/src/ws/dispatcher.ts:201 |
| <a id="property-type"></a> `type` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:200 |
