[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / ManagedReconnectOptions

# Interface: ManagedReconnectOptions

Defined in: packages/mcp/src/client/managed.ts:38

**`Stable`**

Reconnection tuning for [createManagedMCPClient](/api/@graphorin/mcp/functions/createManagedMCPClient.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-initialdelayms"></a> `initialDelayMs?` | `readonly` | `number` | First backoff delay (doubles per attempt, jittered). Default `500` ms. | packages/mcp/src/client/managed.ts:42 |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Attempts per outage before giving up. Default `5`. | packages/mcp/src/client/managed.ts:40 |
| <a id="property-maxdelayms"></a> `maxDelayMs?` | `readonly` | `number` | Backoff ceiling. Default `30_000` ms. | packages/mcp/src/client/managed.ts:44 |
