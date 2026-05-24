[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / discoverToolCallsInSource

# Function: discoverToolCallsInSource()

```ts
function discoverToolCallsInSource(file, source): DiscoveredTool[];
```

Defined in: tool-discovery.ts:183

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
