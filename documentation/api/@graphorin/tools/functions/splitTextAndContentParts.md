[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / splitTextAndContentParts

# Function: splitTextAndContentParts()

```ts
function splitTextAndContentParts(envelope): {
  nonText: readonly MessageContent[];
  text: string;
  textParts: readonly TextContent[];
};
```

Defined in: packages/tools/src/result/envelope.ts:78

**`Stable`**

Split an envelope into its text-shaped payload (subject to the
truncation pipeline + inbound sanitization scan) and its non-text
content parts (passed through untouched).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`ResultEnvelope`](/api/@graphorin/tools/interfaces/ResultEnvelope.md) |

## Returns

```ts
{
  nonText: readonly MessageContent[];
  text: string;
  textParts: readonly TextContent[];
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `nonText` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | packages/tools/src/result/envelope.ts:80 |
| `text` | `string` | packages/tools/src/result/envelope.ts:79 |
| `textParts` | readonly [`TextContent`](/api/@graphorin/core/interfaces/TextContent.md)[] | packages/tools/src/result/envelope.ts:81 |
