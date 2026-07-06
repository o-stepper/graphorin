[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / DiscoveredTool

# Interface: DiscoveredTool

Defined in: [packages/eslint-plugin/src/tool-discovery.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L64)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Tool description (`description:` value) when extractable. | [packages/eslint-plugin/src/tool-discovery.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L72) |
| <a id="property-examplescount"></a> `examplesCount` | `readonly` | `number` | Number of examples declared in the `examples:` array. | [packages/eslint-plugin/src/tool-discovery.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L74) |
| <a id="property-file"></a> `file` | `readonly` | `string` | Source file the call was found in. | [packages/eslint-plugin/src/tool-discovery.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L66) |
| <a id="property-gradingsource"></a> `gradingSource` | `readonly` | `string` | W-044: the same slice with comments blanked - what discovery parsed and what every grading path (examples PII scan, description/parameter scoring) consumes. Same length and line structure as `source`. | [packages/eslint-plugin/src/tool-discovery.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L93) |
| <a id="property-hasexamples"></a> `hasExamples` | `readonly` | `boolean` | Whether `examples:` is a non-empty array literal. | [packages/eslint-plugin/src/tool-discovery.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L76) |
| <a id="property-line"></a> `line` | `readonly` | `number` | 1-indexed line of the `tool(` token. | [packages/eslint-plugin/src/tool-discovery.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L68) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tool name extracted from the `name:` property when present. | [packages/eslint-plugin/src/tool-discovery.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L70) |
| <a id="property-parameternames"></a> `parameterNames` | `readonly` | readonly `string`[] | Snapshot of identifiers referenced from the `inputSchema` Zod chain. | [packages/eslint-plugin/src/tool-discovery.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L78) |
| <a id="property-source"></a> `source` | `readonly` | `string` | Raw object-literal source (ORIGINAL text, comments included). Useful for tests + as a context blob when the CLI needs to surface the original source in a report. | [packages/eslint-plugin/src/tool-discovery.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L86) |
| <a id="property-tags"></a> `tags` | `readonly` | readonly `string`[] | Tags declared on the call (best-effort). | [packages/eslint-plugin/src/tool-discovery.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L80) |
