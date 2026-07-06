[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / discoverToolCallsInSource

# Function: discoverToolCallsInSource()

```ts
function discoverToolCallsInSource(file, source): DiscoveredTool[];
```

Defined in: [packages/eslint-plugin/src/tool-discovery.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L209)

Discover every `tool({...})` invocation in a source string. The
returned findings are stable + frozen so callers can pass them
straight into a JSON report.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `file` | `string` |
| `source` | `string` |

## Returns

[`DiscoveredTool`](/api/@graphorin/eslint-plugin/interfaces/DiscoveredTool.md)[]

## Stable
