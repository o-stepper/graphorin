[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / CreateManagedMCPClientOptions

# Type Alias: CreateManagedMCPClientOptions

```ts
type CreateManagedMCPClientOptions = CreateMCPClientOptions & {
  _clientFactory?: (options) => Promise<MCPClient>;
  reconnect?: ManagedReconnectOptions;
};
```

Defined in: packages/mcp/src/client/managed.ts:48

**`Stable`**

Options for [createManagedMCPClient](/api/@graphorin/mcp/functions/createManagedMCPClient.md).

## Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `_clientFactory()?` | (`options`) => `Promise`\&lt;[`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md)\&gt; | **`Internal`** Client factory seam - tests inject fake inner clients; production uses [createMCPClient](/api/@graphorin/mcp/functions/createMCPClient.md). | packages/mcp/src/client/managed.ts:56 |
| `reconnect?` | [`ManagedReconnectOptions`](/api/@graphorin/mcp/interfaces/ManagedReconnectOptions.md) | - | packages/mcp/src/client/managed.ts:49 |
