[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SuspendedRunRecord

# Interface: SuspendedRunRecord

Defined in: packages/store-sqlite/src/suspended-run-store.ts:11

**`Stable`**

One durably-parked agent run (`awaiting_approval`). `stateJson` is
the agent-serialized resumable `RunState` (the version-stamped,
secret-redacted `graphorin-run-state/x.y` payload produced by
`Agent.serializeState`); the store treats it as an opaque string.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/store-sqlite/src/suspended-run-store.ts:13 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | packages/store-sqlite/src/suspended-run-store.ts:12 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/store-sqlite/src/suspended-run-store.ts:14 |
| <a id="property-statejson"></a> `stateJson` | `readonly` | `string` | - | packages/store-sqlite/src/suspended-run-store.ts:16 |
| <a id="property-suspendedat"></a> `suspendedAt` | `readonly` | `number` | Epoch ms of the FIRST suspension - stable across re-puts. | packages/store-sqlite/src/suspended-run-store.ts:18 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/store-sqlite/src/suspended-run-store.ts:15 |
