[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / TransportCloseReason

# Interface: TransportCloseReason

Defined in: [packages/client/src/transport/types.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L77)

Discriminator returned via [TransportListeners.onClose](/api/@graphorin/client/interfaces/TransportListeners.md#onclose). The
client uses the discriminator to decide whether to reconnect.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `number` | - | [packages/client/src/transport/types.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L78) |
| <a id="property-graphorinreason"></a> `graphorinReason?` | `readonly` | `string` | Optional Graphorin reason discriminator, per `@graphorin/protocol`. | [packages/client/src/transport/types.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L83) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | - | [packages/client/src/transport/types.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L79) |
| <a id="property-wasclean"></a> `wasClean` | `readonly` | `boolean` | True when the close came from a server-side `error` frame. | [packages/client/src/transport/types.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L81) |
