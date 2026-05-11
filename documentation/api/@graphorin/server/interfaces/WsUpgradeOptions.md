[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsUpgradeOptions

# Interface: WsUpgradeOptions

Defined in: packages/server/src/ws/upgrade.ts:40

Public configuration accepted by [createWsUpgradeEvents](/api/@graphorin/server/functions/createWsUpgradeEvents.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dispatcher"></a> `dispatcher` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | - | packages/server/src/ws/upgrade.ts:41 |
| <a id="property-newsubscriberid"></a> `newSubscriberId?` | `readonly` | () => `string` | - | packages/server/src/ws/upgrade.ts:53 |
| <a id="property-newsubscriptionid"></a> `newSubscriptionId?` | `readonly` | () => `string` | - | packages/server/src/ws/upgrade.ts:52 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/ws/upgrade.ts:45 |
| <a id="property-runs"></a> `runs?` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | packages/server/src/ws/upgrade.ts:44 |
| <a id="property-serversubprotocol"></a> `serverSubprotocol?` | `readonly` | `string` | Subprotocol the server advertises. Defaults to [SUBPROTOCOL\_NAME](/api/@graphorin/protocol/subprotocol/variables/SUBPROTOCOL_NAME.md); tests can override to exercise the mismatch path. | packages/server/src/ws/upgrade.ts:51 |
| <a id="property-tickets"></a> `tickets` | `readonly` | [`WsTicketStore`](/api/@graphorin/server/interfaces/WsTicketStore.md) | - | packages/server/src/ws/upgrade.ts:42 |
| <a id="property-verifier"></a> `verifier` | `readonly` | [`TokenVerifier`](/api/@graphorin/security/classes/TokenVerifier.md) | - | packages/server/src/ws/upgrade.ts:43 |
