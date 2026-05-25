[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPClient

# Interface: MCPClient

Defined in: packages/mcp/src/client/types.ts:306

Public surface of an active MCP client.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-collisionstrategy"></a> `collisionStrategy` | `readonly` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) | Per-client default collision strategy. | packages/mcp/src/client/types.ts:314 |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable identifier — derived from the transport. | packages/mcp/src/client/types.ts:308 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Per-client priority value used by the `'priority'` strategy. | packages/mcp/src/client/types.ts:316 |
| <a id="property-resumable"></a> `resumable` | `readonly` | `boolean` | Whether the connected server advertises Streamable HTTP session support (resolved at `initialize` time). | packages/mcp/src/client/types.ts:321 |
| <a id="property-serveridentity"></a> `serverIdentity` | `readonly` | [`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) | Server identity descriptor consumed by the tool-registry resolver. | packages/mcp/src/client/types.ts:312 |
| <a id="property-serverinfo"></a> `serverInfo` | `readonly` | \{ `name`: `string`; `version`: `string`; \} | Server-advertised information from the `initialize` handshake. | packages/mcp/src/client/types.ts:310 |
| `serverInfo.name` | `readonly` | `string` | - | packages/mcp/src/client/types.ts:310 |
| `serverInfo.version` | `readonly` | `string` | - | packages/mcp/src/client/types.ts:310 |

## Methods

### callTool()

```ts
callTool(
   name, 
   args, 
opts?): Promise<MCPCallToolResult>;
```

Defined in: packages/mcp/src/client/types.ts:326

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `args` | `unknown` |
| `opts?` | \{ `signal?`: `AbortSignal`; `timeoutMs?`: `number`; \} |
| `opts.signal?` | `AbortSignal` |
| `opts.timeoutMs?` | `number` |

#### Returns

`Promise`\&lt;[`MCPCallToolResult`](/api/@graphorin/mcp/interfaces/MCPCallToolResult.md)\&gt;

***

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/mcp/src/client/types.ts:338

#### Returns

`Promise`\&lt;`void`\&gt;

***

### getPrompt()

```ts
getPrompt(
   name, 
   args?, 
   opts?): Promise<{
  messages: readonly MCPPromptMessage[];
}>;
```

Defined in: packages/mcp/src/client/types.ts:332

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `args?` | `unknown` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\<\{
  `messages`: readonly [`MCPPromptMessage`](/api/@graphorin/mcp/interfaces/MCPPromptMessage.md)[];
\}\>

***

### listPrompts()

```ts
listPrompts(opts?): Promise<readonly MCPPromptDefinition[]>;
```

Defined in: packages/mcp/src/client/types.ts:325

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`MCPPromptDefinition`](/api/@graphorin/mcp/interfaces/MCPPromptDefinition.md)[]\&gt;

***

### listResources()

```ts
listResources(opts?): Promise<readonly MCPResourceDefinition[]>;
```

Defined in: packages/mcp/src/client/types.ts:324

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`MCPResourceDefinition`](/api/@graphorin/mcp/interfaces/MCPResourceDefinition.md)[]\&gt;

***

### listTools()

```ts
listTools(opts?): Promise<readonly MCPToolDefinition[]>;
```

Defined in: packages/mcp/src/client/types.ts:323

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`MCPToolDefinition`](/api/@graphorin/mcp/interfaces/MCPToolDefinition.md)[]\&gt;

***

### readResource()

```ts
readResource(uri, opts?): Promise<MCPResourceContent>;
```

Defined in: packages/mcp/src/client/types.ts:331

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;[`MCPResourceContent`](/api/@graphorin/mcp/interfaces/MCPResourceContent.md)\&gt;

***

### toTools()

```ts
toTools(opts?): Promise<readonly Tool<unknown, unknown, unknown>[]>;
```

Defined in: packages/mcp/src/client/types.ts:337

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | [`MCPToToolsOptions`](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md) |

#### Returns

`Promise`\<readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[]\>
