[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunPreBindOptions

# Interface: RunPreBindOptions

Defined in: packages/server/src/lifecycle/pre-bind.ts:53

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | - | packages/server/src/lifecycle/pre-bind.ts:54 |
| <a id="property-probecipherpeer"></a> `probeCipherPeer?` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Optional override for the cipher-peer probe. Tests inject a stub that signals "missing peer" without uninstalling the real one. | packages/server/src/lifecycle/pre-bind.ts:60 |
| <a id="property-store"></a> `store` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | - | packages/server/src/lifecycle/pre-bind.ts:55 |
