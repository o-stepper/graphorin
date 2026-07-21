[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / readToolCassette

# Function: readToolCassette()

```ts
function readToolCassette(body): ToolCassetteReadResult;
```

Defined in: packages/sessions/src/cassette/reader.ts:55

**`Stable`**

Parse a cassette body. Validates the sentinel header / footer,
the schema MAJOR band, the body checksum (when present), and the
`tool-call` cursor monotonicity.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |

## Returns

[`ToolCassetteReadResult`](/api/@graphorin/sessions/interfaces/ToolCassetteReadResult.md)
