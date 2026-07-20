[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / toolReturn

# Function: toolReturn()

```ts
function toolReturn<TOutput>(fields): ToolReturn<TOutput>;
```

Defined in: packages/core/src/contracts/tool.ts:288

**`Stable`**

Build a BRANDED [ToolReturn](/api/@graphorin/core/interfaces/ToolReturn.md) envelope. The executor
unwraps branded envelopes unconditionally; unbranded objects fall to
a deliberately narrow structural sniff (own keys within
`{output, contentParts, taint}`), so a tool legitimately returning
`{ output, exitCode, stderr }` is no longer silently stripped to its
`output` field.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fields` | \{ `contentParts?`: readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[]; `output`: `TOutput`; `taint?`: \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \}; \} |
| `fields.contentParts?` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] |
| `fields.output` | `TOutput` |
| `fields.taint?` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} |
| `fields.taint.sensitive?` | `boolean` |
| `fields.taint.sourceKind?` | `string` |
| `fields.taint.untrusted?` | `boolean` |

## Returns

[`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt;
