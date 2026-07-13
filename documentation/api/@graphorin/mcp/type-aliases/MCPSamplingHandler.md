[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingHandler

# Type Alias: MCPSamplingHandler

```ts
type MCPSamplingHandler = (request, opts) => 
  | MCPSamplingResult
| Promise<MCPSamplingResult>;
```

Defined in: [packages/mcp/src/client/types.ts:191](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L191)

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
