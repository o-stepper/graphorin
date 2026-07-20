[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / resolveTrustClass

# Function: resolveTrustClass()

```ts
function resolveTrustClass(source): ToolTrustClass;
```

Defined in: packages/tools/src/builder/trust-class.ts:33

**`Stable`**

Resolve the trust class for a registration. The `'web-search'`
subsystem name is special-cased so the built-in web-search adapter
(when present) gets the same treatment as MCP-derived tools even
though it is structurally a built-in tool.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) |

## Returns

[`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md)
