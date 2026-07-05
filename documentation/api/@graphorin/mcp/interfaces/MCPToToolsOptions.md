[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToToolsOptions

# Interface: MCPToToolsOptions

Defined in: packages/mcp/src/client/types.ts:198

Per-MCP-server `toTools()` options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-calltimeoutms"></a> `callTimeoutMs?` | `readonly` | `number` | Per-call timeout (ms) applied to every adapted tool's `client.callTool` invocation (MC-3/MC-5). Default: the SDK default. | packages/mcp/src/client/types.ts:212 |
| <a id="property-defer_loading"></a> `defer_loading?` | `readonly` | `boolean` | Per-server `defer_loading` override. When unset and `listTools()` returns more than `deferLoadingThreshold` entries the auto-default flips deferral on for every tool from this server. | packages/mcp/src/client/types.ts:242 |
| <a id="property-deferloadingthreshold"></a> `deferLoadingThreshold?` | `readonly` | `number` | Auto-default trigger threshold. Defaults to `10`. | packages/mcp/src/client/types.ts:244 |
| <a id="property-filter"></a> `filter?` | `readonly` | (`tool`) => `boolean` | Filter the produced tools. | packages/mcp/src/client/types.ts:200 |
| <a id="property-inboundsanitization"></a> `inboundSanitization?` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | Per-server inbound prompt-injection sanitization policy override. Defaults to `'detect-and-strip-and-wrap'` for MCP-derived tools. | packages/mcp/src/client/types.ts:207 |
| <a id="property-maxresulttokens"></a> `maxResultTokens?` | `readonly` | `number` | Per-server token cap override applied at registration. | packages/mcp/src/client/types.ts:246 |
| <a id="property-namespace"></a> `namespace?` | `readonly` | `string` | Tool-name namespace prepended to every produced tool. | packages/mcp/src/client/types.ts:202 |
| <a id="property-onpinmismatch"></a> `onPinMismatch?` | `readonly` | `"warn"` \| `"reject"` | What to do on a pinned-fingerprint mismatch (MC-6). `'warn'` (default without a [pinStore](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md#property-pinstore)) audits `mcp.tools.pin-mismatch.total` and continues; `'reject'` (the default WHEN a `pinStore` is wired - a persisted first approval is an explicit trust decision) throws `MCPToolPinningError`. | packages/mcp/src/client/types.ts:226 |
| <a id="property-pinnedfingerprints"></a> `pinnedFingerprints?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Operator-pinned definition fingerprints by MCP tool name (MC-6) - the `__definitionHash` stamped on a previously approved snapshot. A mismatch means the server changed the definition behind the name. | packages/mcp/src/client/types.ts:218 |
| <a id="property-pinstore"></a> `pinStore?` | `readonly` | `MCPPinStore` | C6: durable trust-on-first-use pin storage. On the first `toTools()` the current definition fingerprints are RECORDED (`mcp.tools.pins-recorded.total`); on every later call they are COMPARED - drift is handled per [onPinMismatch](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md#property-onpinmismatch), which defaults to `'reject'` when a store is present (the rug-pull defense). Explicit `pinnedFingerprints` win over the store. | packages/mcp/src/client/types.ts:235 |
| <a id="property-preferredmodelbytool"></a> `preferredModelByTool?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)\&gt;\> | Tool-name -> per-tool preferred-model override map. | packages/mcp/src/client/types.ts:252 |
| <a id="property-sideeffectclassbytool"></a> `sideEffectClassByTool?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md)\&gt;\> | Tool-name -> per-tool side-effect class override map. | packages/mcp/src/client/types.ts:250 |
| <a id="property-truncationstrategy"></a> `truncationStrategy?` | `readonly` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) | Per-server truncation strategy override applied at registration. | packages/mcp/src/client/types.ts:248 |
