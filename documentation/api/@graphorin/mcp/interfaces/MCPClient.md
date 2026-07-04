[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPClient

# Interface: MCPClient

Defined in: packages/mcp/src/client/types.ts:339

Public surface of an active MCP client.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-collisionstrategy"></a> `collisionStrategy` | `readonly` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) | Per-client default collision strategy. | packages/mcp/src/client/types.ts:347 |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable identifier — derived from the transport. | packages/mcp/src/client/types.ts:341 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Per-client priority value used by the `'priority'` strategy. | packages/mcp/src/client/types.ts:349 |
| <a id="property-resumable"></a> ~~`resumable`~~ | `readonly` | `boolean` | **Deprecated** Alias of [sessionIdPresent](/api/@graphorin/mcp/interfaces/MCPClient.md#property-sessionidpresent) — same value, misleading name. | packages/mcp/src/client/types.ts:360 |
| <a id="property-serveridentity"></a> `serverIdentity` | `readonly` | [`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) | Server identity descriptor consumed by the tool-registry resolver. | packages/mcp/src/client/types.ts:345 |
| <a id="property-serverinfo"></a> `serverInfo` | `readonly` | \{ `name`: `string`; `version`: `string`; \} | Server-advertised information from the `initialize` handshake. | packages/mcp/src/client/types.ts:343 |
| `serverInfo.name` | `readonly` | `string` | - | packages/mcp/src/client/types.ts:343 |
| `serverInfo.version` | `readonly` | `string` | - | packages/mcp/src/client/types.ts:343 |
| <a id="property-sessionidpresent"></a> `sessionIdPresent` | `readonly` | `boolean` | Whether the Streamable HTTP server assigned an `Mcp-Session-Id` at `initialize` time (MC-9). A session id means stateful routing — it is NOT a replay guarantee: per the Streamable HTTP spec, event replay is the SERVER's responsibility, and the SDK transport already auto-reconnects with `Last-Event-ID` when the server supports it. | packages/mcp/src/client/types.ts:358 |

## Methods

### callTool()

```ts
callTool(
   name, 
   args, 
opts?): Promise<MCPCallToolResult>;
```

Defined in: packages/mcp/src/client/types.ts:365

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

Defined in: packages/mcp/src/client/types.ts:388

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

Defined in: packages/mcp/src/client/types.ts:382

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

Defined in: packages/mcp/src/client/types.ts:364

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

Defined in: packages/mcp/src/client/types.ts:363

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

Defined in: packages/mcp/src/client/types.ts:362

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

Defined in: packages/mcp/src/client/types.ts:376

First content item of the resource. mcp-skills-11: a multi-content
response (one URI can yield several items) is truncated to the
FIRST item — a WARN + counter fire when that happens; use
[readResourceContents](/api/@graphorin/mcp/interfaces/MCPClient.md#readresourcecontents) for the full array.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;[`MCPResourceContent`](/api/@graphorin/mcp/interfaces/MCPResourceContent.md)\&gt;

***

### readResourceContents()

```ts
readResourceContents(uri, opts?): Promise<readonly MCPResourceContent[]>;
```

Defined in: packages/mcp/src/client/types.ts:378

Every content item of the resource (mcp-skills-11).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`MCPResourceContent`](/api/@graphorin/mcp/interfaces/MCPResourceContent.md)[]\&gt;

***

### toTools()

```ts
toTools(opts?): Promise<readonly Tool<unknown, unknown, unknown>[]>;
```

Defined in: packages/mcp/src/client/types.ts:387

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | [`MCPToToolsOptions`](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md) |

#### Returns

`Promise`\<readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[]\>
