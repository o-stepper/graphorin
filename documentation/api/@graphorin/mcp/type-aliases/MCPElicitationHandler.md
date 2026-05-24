[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPElicitationHandler

# Type Alias: MCPElicitationHandler

```ts
type MCPElicitationHandler = (request, opts) => 
  | MCPElicitationResult
| Promise<MCPElicitationResult>;
```

Defined in: packages/mcp/src/client/types.ts:128

Handler for server-initiated elicitation requests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`MCPElicitationRequest`](/api/@graphorin/mcp/interfaces/MCPElicitationRequest.md) |
| `opts` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

## Returns

  \| [`MCPElicitationResult`](/api/@graphorin/mcp/type-aliases/MCPElicitationResult.md)
  \| `Promise`\&lt;[`MCPElicitationResult`](/api/@graphorin/mcp/type-aliases/MCPElicitationResult.md)\&gt;
