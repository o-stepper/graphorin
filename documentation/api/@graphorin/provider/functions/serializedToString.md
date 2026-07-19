[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / serializedToString

# Function: serializedToString()

```ts
function serializedToString(msg): string;
```

Defined in: packages/provider/src/counters/serialize.ts:79

**`Internal`**

Render a `SerializedMessage` as a single string with role prefix.
Useful for naive estimators that count by character length.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `msg` | [`SerializedMessage`](/api/@graphorin/provider/interfaces/SerializedMessage.md) |

## Returns

`string`
