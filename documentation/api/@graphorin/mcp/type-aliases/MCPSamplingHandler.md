[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingHandler

# Type Alias: MCPSamplingHandler

```ts
type MCPSamplingHandler = (request, opts) => 
  | MCPSamplingResult
| Promise<MCPSamplingResult>;
```

Defined in: packages/mcp/src/client/types.ts:191

Handler for server-initiated sampling requests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`MCPSamplingRequest`](/api/@graphorin/mcp/interfaces/MCPSamplingRequest.md) |
| `opts` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

## Returns

  \| [`MCPSamplingResult`](/api/@graphorin/mcp/interfaces/MCPSamplingResult.md)
  \| `Promise`\&lt;[`MCPSamplingResult`](/api/@graphorin/mcp/interfaces/MCPSamplingResult.md)\&gt;
