[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / parseAdjudication

# Function: parseAdjudication()

```ts
function parseAdjudication(text): boolean;
```

Defined in: [packages/memory/src/graph/entity-resolver.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L213)

Parse a yes/no adjudication reply. Conservative: only a clear yes is `true`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`boolean`
