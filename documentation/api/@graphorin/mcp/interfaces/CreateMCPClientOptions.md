[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / CreateMCPClientOptions

# Interface: CreateMCPClientOptions

Defined in: packages/mcp/src/client/types.ts:27

Options accepted by [createMCPClient](/api/@graphorin/mcp/functions/createMCPClient.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authprovider"></a> `authProvider?` | `readonly` | [`OAuthAuthorizationProvider`](/api/@graphorin/mcp/interfaces/OAuthAuthorizationProvider.md) | Pre-built OAuth provider that resolves the bearer header on every request. Mutually exclusive with [bearerToken](/api/@graphorin/mcp/interfaces/CreateMCPClientOptions.md#property-bearertoken). | packages/mcp/src/client/types.ts:33 |
| <a id="property-bearertoken"></a> `bearerToken?` | `readonly` | `string` | Pre-shared bearer token (rare; prefer [authProvider](/api/@graphorin/mcp/interfaces/CreateMCPClientOptions.md#property-authprovider)). | packages/mcp/src/client/types.ts:35 |
| <a id="property-clientname"></a> `clientName?` | `readonly` | `string` | Operator-supplied client name advertised to the server on `initialize`. | packages/mcp/src/client/types.ts:60 |
| <a id="property-clientversion"></a> `clientVersion?` | `readonly` | `string` | Operator-supplied client version advertised to the server on `initialize`. | packages/mcp/src/client/types.ts:62 |
| <a id="property-collisionstrategy"></a> `collisionStrategy?` | `readonly` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) | Per-client default for the strategy-aware tool registry. Falls through to the per-call value on [MCPClient.toTools](/api/@graphorin/mcp/interfaces/MCPClient.md#totools). **Default** `'auto-prefix'` | packages/mcp/src/client/types.ts:42 |
| <a id="property-eventstore"></a> `eventStore?` | `readonly` | [`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md) | Pluggable [EventStore](/api/@graphorin/mcp/interfaces/EventStore.md) for resumable Streamable HTTP sessions. The default is the in-memory store with capacity `1024`. | packages/mcp/src/client/types.ts:50 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `fields?`) => `void` | Operator-supplied logger. | packages/mcp/src/client/types.ts:54 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Per-client priority value used by the `'priority'` strategy. | packages/mcp/src/client/types.ts:44 |
| <a id="property-serverinfoname"></a> `serverInfoName?` | `readonly` | `string` | Operator-supplied server identity overrides. | packages/mcp/src/client/types.ts:52 |
| <a id="property-suppressdeprecatedtransportwarning"></a> `suppressDeprecatedTransportWarning?` | `readonly` | `boolean` | Skip the deprecated-transport WARN log. Useful for tests + the standalone server's startup banner. **Default** `false` | packages/mcp/src/client/types.ts:69 |
| <a id="property-transport"></a> `transport` | `readonly` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) | - | packages/mcp/src/client/types.ts:28 |
