[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / BareEventFrame

# Interface: BareEventFrame

Defined in: [packages/server/src/ws/dispatcher.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L184)

Frame argument accepted by [WsDispatcher.emit](/api/@graphorin/server/interfaces/WsDispatcher.md#emit). The
dispatcher fills in `subscriptionId`, `subject`, and `eventId`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-eventid"></a> `eventId?` | `readonly` | `string` | [packages/server/src/ws/dispatcher.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L187) |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | [packages/server/src/ws/dispatcher.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L186) |
| <a id="property-type"></a> `type` | `readonly` | `string` | [packages/server/src/ws/dispatcher.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L185) |
