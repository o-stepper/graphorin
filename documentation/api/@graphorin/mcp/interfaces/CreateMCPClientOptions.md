[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / CreateMCPClientOptions

# Interface: CreateMCPClientOptions

Defined in: packages/mcp/src/client/types.ts:26

**`Stable`**

Options accepted by [createMCPClient](/api/@graphorin/mcp/functions/createMCPClient.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authprovider"></a> `authProvider?` | `readonly` | [`OAuthAuthorizationProvider`](/api/@graphorin/mcp/interfaces/OAuthAuthorizationProvider.md) | Pre-built OAuth provider that resolves the bearer header on every request. Mutually exclusive with [bearerToken](/api/@graphorin/mcp/interfaces/CreateMCPClientOptions.md#property-bearertoken). | packages/mcp/src/client/types.ts:32 |
| <a id="property-bearertoken"></a> `bearerToken?` | `readonly` | `string` | Pre-shared bearer token (rare; prefer [authProvider](/api/@graphorin/mcp/interfaces/CreateMCPClientOptions.md#property-authprovider)). | packages/mcp/src/client/types.ts:34 |
| <a id="property-clientname"></a> `clientName?` | `readonly` | `string` | Operator-supplied client name advertised to the server on `initialize`. | packages/mcp/src/client/types.ts:53 |
| <a id="property-clientversion"></a> `clientVersion?` | `readonly` | `string` | Operator-supplied client version advertised to the server on `initialize`. | packages/mcp/src/client/types.ts:55 |
| <a id="property-collisionstrategy"></a> `collisionStrategy?` | `readonly` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) | Per-client default for the strategy-aware tool registry. Falls through to the per-call value on [MCPClient.toTools](/api/@graphorin/mcp/interfaces/MCPClient.md#totools). **Default** `'auto-prefix'` | packages/mcp/src/client/types.ts:41 |
| <a id="property-elicitation"></a> `elicitation?` | `readonly` | [`MCPElicitationHandler`](/api/@graphorin/mcp/type-aliases/MCPElicitationHandler.md) | Handler for server-initiated **elicitation** (`elicitation/create`) requests - the server asks the human for structured input mid-call. When provided, the client advertises the `elicitation` capability and routes requests here; back it with a HITL surface (e.g. a CLI prompt or the agent's approval channel). When omitted, the capability is **not** advertised and a conforming server will not elicit (gated; no implicit prompting). Note: an elicitation arrives while a `callTool(...)` JSON-RPC request is in flight, so the handler resolves in-process - it does not durably suspend a Graphorin run. Durable-suspend elicitation across the request lifetime is a follow-up. | packages/mcp/src/client/types.ts:77 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `fields?`) => `void` | Operator-supplied logger. | packages/mcp/src/client/types.ts:47 |
| <a id="property-ontransportclose"></a> `onTransportClose?` | `readonly` | (`info`) => `void` | Called when the underlying transport closes (a stdio child dying, an HTTP session dropping beyond the SDK's SSE resume). Without it a disconnect is observable only as `MCPProtocolError`s on subsequent calls. The client does NOT auto-reconnect - rebuild it via `createMCPClient(...)` (and re-run `toTools()` for the drift diff) when this fires, or use the `createManagedMCPClient(...)` wrapper, which does exactly that automatically (there the operator callback fires only when the wrapper's reconnect attempts are exhausted). | packages/mcp/src/client/types.ts:100 |
| <a id="property-ontransporterror"></a> `onTransportError?` | `readonly` | (`error`, `info`) => `void` | Called on transport-level errors (see [onTransportClose](/api/@graphorin/mcp/interfaces/CreateMCPClientOptions.md#property-ontransportclose)). | packages/mcp/src/client/types.ts:102 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Per-client priority value used by the `'priority'` strategy. | packages/mcp/src/client/types.ts:43 |
| <a id="property-sampling"></a> `sampling?` | `readonly` | [`MCPSamplingHandler`](/api/@graphorin/mcp/type-aliases/MCPSamplingHandler.md) | Handler for server-initiated **sampling** (`sampling/createMessage`) requests - the server asks the client's model to generate a completion. When provided, the client advertises the `sampling` capability and routes requests here; back it with a `Provider`. The request messages are **MCP-derived (untrusted)**, so the backing provider should apply the usual sensitivity/redaction middleware. When omitted, the capability is **not** advertised (gated). | packages/mcp/src/client/types.ts:88 |
| <a id="property-serverinfoname"></a> `serverInfoName?` | `readonly` | `string` | Operator-supplied server identity overrides. | packages/mcp/src/client/types.ts:45 |
| <a id="property-suppressdeprecatedtransportwarning"></a> `suppressDeprecatedTransportWarning?` | `readonly` | `boolean` | Skip the deprecated-transport WARN log. Useful for tests + the standalone server's startup banner. **Default** `false` | packages/mcp/src/client/types.ts:62 |
| <a id="property-transport"></a> `transport` | `readonly` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) | - | packages/mcp/src/client/types.ts:27 |
