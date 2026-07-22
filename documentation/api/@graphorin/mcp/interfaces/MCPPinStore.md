[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPPinStore

# Interface: MCPPinStore

Defined in: packages/mcp/src/client/types.ts:414

**`Stable`**

Durable storage for trust-on-first-use MCP tool pins. Keyed by the
server identity id; values are `toolName -> sha256 fingerprint` maps
(the same shape as `pinnedFingerprints`). Implementations may be sync
or async - a JSON file, a SQLite table, a secret store.

## Methods

### get()

```ts
get(serverId): 
  | Readonly<Record<string, string>>
  | Promise<Readonly<Record<string, string>> | undefined>
  | undefined;
```

Defined in: packages/mcp/src/client/types.ts:415

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `serverId` | `string` |

#### Returns

  \| `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\>
  \| `Promise`\<`Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> \| `undefined`\>
  \| `undefined`

***

### set()

```ts
set(serverId, fingerprints): void | Promise<void>;
```

Defined in: packages/mcp/src/client/types.ts:421

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `serverId` | `string` |
| `fingerprints` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> |

#### Returns

`void` \| `Promise`\&lt;`void`\&gt;
