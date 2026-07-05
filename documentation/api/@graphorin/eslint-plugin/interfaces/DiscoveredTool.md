[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / DiscoveredTool

# Interface: DiscoveredTool

Defined in: src/tool-discovery.ts:46

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Tool description (`description:` value) when extractable. | src/tool-discovery.ts:54 |
| <a id="property-examplescount"></a> `examplesCount` | `readonly` | `number` | Number of examples declared in the `examples:` array. | src/tool-discovery.ts:56 |
| <a id="property-file"></a> `file` | `readonly` | `string` | Source file the call was found in. | src/tool-discovery.ts:48 |
| <a id="property-hasexamples"></a> `hasExamples` | `readonly` | `boolean` | Whether `examples:` is a non-empty array literal. | src/tool-discovery.ts:58 |
| <a id="property-line"></a> `line` | `readonly` | `number` | 1-indexed line of the `tool(` token. | src/tool-discovery.ts:50 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tool name extracted from the `name:` property when present. | src/tool-discovery.ts:52 |
| <a id="property-parameternames"></a> `parameterNames` | `readonly` | readonly `string`[] | Snapshot of identifiers referenced from the `inputSchema` Zod chain. | src/tool-discovery.ts:60 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Raw object-literal source. Useful for tests + as a context blob when the CLI needs to surface the original source in a report. | src/tool-discovery.ts:67 |
| <a id="property-tags"></a> `tags` | `readonly` | readonly `string`[] | Tags declared on the call (best-effort). | src/tool-discovery.ts:62 |
