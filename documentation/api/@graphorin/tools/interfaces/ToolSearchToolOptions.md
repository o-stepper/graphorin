[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchToolOptions

# Interface: ToolSearchToolOptions

Defined in: packages/tools/src/built-in/tool-search.ts:24

Configuration for [createToolSearchTool](/api/@graphorin/tools/functions/createToolSearchTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-availability"></a> `availability?` | `readonly` | `"next-step"` \| `"next-run"` | When matched tools become callable, reflected in the model-facing description so the model is never promised availability the harness does not deliver. `'next-step'` (default) matches the agent's immediate promotion mode; `'next-run'` matches `toolPromotion: 'run-boundary'`, where the catalogue is frozen for the current run. | packages/tools/src/built-in/tool-search.ts:38 |
| <a id="property-defaultk"></a> `defaultK?` | `readonly` | `number` | Default `k` when the model does not pass one. Default `5`. | packages/tools/src/built-in/tool-search.ts:27 |
| <a id="property-excludetool"></a> `excludeTool?` | `readonly` | (`toolName`) => `boolean` | Deny-by-name: matches returning `true` are dropped from the results BEFORE the model sees them, so a name-denied deferred tool is neither discoverable nor promoted into the advertised set (its name and schema would otherwise leak while execution stays blocked). The agent wires the permission policy's name-level deny here; absent ⇒ no exclusion. | packages/tools/src/built-in/tool-search.ts:47 |
| <a id="property-maxk"></a> `maxK?` | `readonly` | `number` | Hard cap on `k` (model-supplied). Default `15`. | packages/tools/src/built-in/tool-search.ts:29 |
| <a id="property-registry"></a> `registry` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | - | packages/tools/src/built-in/tool-search.ts:25 |
