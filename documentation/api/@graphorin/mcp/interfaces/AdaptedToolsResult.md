[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / AdaptedToolsResult

# Interface: AdaptedToolsResult

Defined in: packages/mcp/src/client/to-tools.ts:59

Result returned by [adaptMCPTools](/api/@graphorin/mcp/functions/adaptMCPTools.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autodeferralfired"></a> `autoDeferralFired` | `readonly` | `boolean` | - | packages/mcp/src/client/to-tools.ts:63 |
| <a id="property-deferralthreshold"></a> `deferralThreshold` | `readonly` | `number` | - | packages/mcp/src/client/to-tools.ts:67 |
| <a id="property-downgradedtools"></a> `downgradedTools` | `readonly` | readonly `string`[] | Tool names the operator downgraded below the sink classes via `sideEffectClassByTool` (`'read-only'` / `'pure'`). Each such tool leaves EVERY sink check - the dataflow gate, the Rule-of-Two writer forbid, the read-only capability gate - so operator audits should review this list. Empty when no override downgrades. | packages/mcp/src/client/to-tools.ts:75 |
| <a id="property-fingerprints"></a> `fingerprints` | `readonly` | `ReadonlyMap`\&lt;`string`, `string`\&gt; | sha256 definition fingerprint per MCP tool name. | packages/mcp/src/client/to-tools.ts:62 |
| <a id="property-resolveddeferloading"></a> `resolvedDeferLoading` | `readonly` | `boolean` | - | packages/mcp/src/client/to-tools.ts:64 |
| <a id="property-resolvedinboundsanitization"></a> `resolvedInboundSanitization` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | - | packages/mcp/src/client/to-tools.ts:65 |
| <a id="property-toolcount"></a> `toolCount` | `readonly` | `number` | - | packages/mcp/src/client/to-tools.ts:66 |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[] | - | packages/mcp/src/client/to-tools.ts:60 |
