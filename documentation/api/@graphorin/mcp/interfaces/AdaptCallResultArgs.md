[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / AdaptCallResultArgs

# Interface: AdaptCallResultArgs

Defined in: packages/mcp/src/client/adapt-result.ts:27

Arguments for [adaptCallResult](/api/@graphorin/mcp/functions/adaptCallResult.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-inboundsanitization"></a> `inboundSanitization?` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | Effective per-server inbound-sanitization policy, applied to the `isError` text before it rides into `MCPToolExecutionError` (the executor never sanitizes the error path, so the trust-aware MCP boundary must). Defaults to the MCP-strict `'detect-and-strip-and-wrap'` when omitted. | packages/mcp/src/client/adapt-result.ts:39 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `fields?`) => `void` | - | packages/mcp/src/client/adapt-result.ts:40 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`unknown`, `unknown`\&gt; | - | packages/mcp/src/client/adapt-result.ts:29 |
| <a id="property-result"></a> `result` | `readonly` | [`MCPCallToolResult`](/api/@graphorin/mcp/interfaces/MCPCallToolResult.md) | - | packages/mcp/src/client/adapt-result.ts:28 |
| <a id="property-serveridentity"></a> `serverIdentity` | `readonly` | [`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) | - | packages/mcp/src/client/adapt-result.ts:30 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/mcp/src/client/adapt-result.ts:31 |
