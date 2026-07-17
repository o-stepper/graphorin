[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / readToolCassette

# Function: readToolCassette()

```ts
function readToolCassette(body): ToolCassetteReadResult;
```

Defined in: [packages/sessions/src/cassette/reader.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L55)

Parse a cassette body. Validates the sentinel header / footer,
the schema MAJOR band, the body checksum (when present), and the
`tool-call` cursor monotonicity.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |

## Returns

[`ToolCassetteReadResult`](/api/@graphorin/sessions/interfaces/ToolCassetteReadResult.md)

## Stable
