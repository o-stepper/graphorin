[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / toSpanAttributes

# Function: toSpanAttributes()

```ts
function toSpanAttributes(annotation): Readonly<Record<string, string>>;
```

Defined in: packages/memory/src/context-engine/annotations.ts:139

**`Stable`**

Convert a [ContentAnnotation](/api/@graphorin/memory/interfaces/ContentAnnotation.md) to a span-attributes record
suitable for `AISpan.setAttributes(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `annotation` | [`ContentAnnotation`](/api/@graphorin/memory/interfaces/ContentAnnotation.md) |

## Returns

`Readonly`\<`Record`\&lt;`string`, `string`\&gt;\>
