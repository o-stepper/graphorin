[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / deriveServerIdentity

# Function: deriveServerIdentity()

```ts
function deriveServerIdentity(transport, serverInfoName?): ServerIdentity;
```

Defined in: packages/mcp/src/helpers/identity.ts:37

**`Stable`**

Compute the canonical [ServerIdentity](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) for the supplied
transport. The id is suitable for use as a registry key and as the
operator-facing label in audit rows + trace attributes.

The id derives ONLY from operator-controlled data (the
transport config) plus the optional operator-supplied
`serverInfoName` override. The name a server self-reports on
`initialize` never participates: every security-relevant surface
keys off this id (TOFU pins, `mcp:<id>:<uri>` handle scoping, taint
labels, audit rows), and a server-controlled id let a rug-pull
server mint a fresh TOFU record by renaming itself, or impersonate a
trusted server's scope by claiming its name. HTTP-family ids include
a non-default port, so localhost:3001 and localhost:3002 are
distinct servers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `transport` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) |
| `serverInfoName?` | `string` |

## Returns

[`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md)
