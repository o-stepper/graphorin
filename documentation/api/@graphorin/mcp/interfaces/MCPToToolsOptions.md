[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToToolsOptions

# Interface: MCPToToolsOptions

Defined in: packages/mcp/src/client/types.ts:77

Per-MCP-server `toTools()` options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-collisionstrategy"></a> `collisionStrategy?` | `readonly` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) | Per-call collision-strategy override. | packages/mcp/src/client/types.ts:101 |
| <a id="property-defer_loading"></a> `defer_loading?` | `readonly` | `boolean` | Per-server `defer_loading` override. When unset and `listTools()` returns more than `deferLoadingThreshold` entries the auto-default flips deferral on for every tool from this server. | packages/mcp/src/client/types.ts:93 |
| <a id="property-deferloadingthreshold"></a> `deferLoadingThreshold?` | `readonly` | `number` | Auto-default trigger threshold. Defaults to `10`. | packages/mcp/src/client/types.ts:95 |
| <a id="property-filter"></a> `filter?` | `readonly` | (`tool`) => `boolean` | Filter the produced tools. | packages/mcp/src/client/types.ts:79 |
| <a id="property-inboundsanitization"></a> `inboundSanitization?` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | Per-server inbound prompt-injection sanitization policy override. Defaults to `'detect-and-strip-and-wrap'` for MCP-derived tools. | packages/mcp/src/client/types.ts:86 |
| <a id="property-maxresulttokens"></a> `maxResultTokens?` | `readonly` | `number` | Per-server token cap override applied at registration. | packages/mcp/src/client/types.ts:97 |
| <a id="property-namespace"></a> `namespace?` | `readonly` | `string` | Tool-name namespace prepended to every produced tool. | packages/mcp/src/client/types.ts:81 |
| <a id="property-preferredmodelbytool"></a> `preferredModelByTool?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)\&gt;\> | Tool-name -> per-tool preferred-model override map. | packages/mcp/src/client/types.ts:107 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Per-call priority value used by the `'priority'` strategy. | packages/mcp/src/client/types.ts:103 |
| <a id="property-sideeffectclassbytool"></a> `sideEffectClassByTool?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md)\&gt;\> | Tool-name -> per-tool side-effect class override map. | packages/mcp/src/client/types.ts:105 |
| <a id="property-truncationstrategy"></a> `truncationStrategy?` | `readonly` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) | Per-server truncation strategy override applied at registration. | packages/mcp/src/client/types.ts:99 |
