[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsUpgradeOptions

# Interface: WsUpgradeOptions

Defined in: packages/server/src/ws/upgrade.ts:59

Public configuration accepted by [createWsUpgradeEvents](/api/@graphorin/server/functions/createWsUpgradeEvents.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-anonymous"></a> `anonymous?` | `readonly` | `boolean` | IP-13: authentication is disabled server-wide (`auth.kind='none'`). Accept the upgrade unconditionally with a full (`admin:*`) scope grant instead of silently refusing to mount the WS route. Trusted-loopback / single-operator mode only. | packages/server/src/ws/upgrade.ts:74 |
| <a id="property-dispatcher"></a> `dispatcher` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | - | packages/server/src/ws/upgrade.ts:60 |
| <a id="property-newsubscriberid"></a> `newSubscriberId?` | `readonly` | () => `string` | - | packages/server/src/ws/upgrade.ts:84 |
| <a id="property-newsubscriptionid"></a> `newSubscriptionId?` | `readonly` | () => `string` | - | packages/server/src/ws/upgrade.ts:83 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/ws/upgrade.ts:76 |
| <a id="property-runs"></a> `runs?` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | packages/server/src/ws/upgrade.ts:75 |
| <a id="property-serversubprotocol"></a> `serverSubprotocol?` | `readonly` | `string` | Subprotocol the server advertises. Defaults to [SUBPROTOCOL\_NAME](/api/@graphorin/protocol/subprotocol/variables/SUBPROTOCOL_NAME.md); tests can override to exercise the mismatch path. | packages/server/src/ws/upgrade.ts:82 |
| <a id="property-tickets"></a> `tickets` | `readonly` | [`WsTicketStore`](/api/@graphorin/server/interfaces/WsTicketStore.md) | - | packages/server/src/ws/upgrade.ts:61 |
| <a id="property-verifier"></a> `verifier?` | `readonly` | [`TokenVerifier`](/api/@graphorin/security/classes/TokenVerifier.md) | Token verifier for bearer / ticket upgrades. Optional only in the IP-13 no-auth loopback mode (`anonymous: true`), where there is no verifier to construct and every upgrade is accepted. | packages/server/src/ws/upgrade.ts:67 |
