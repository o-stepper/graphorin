[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / sha256OfValue

# Function: sha256OfValue()

```ts
function sha256OfValue(value): string;
```

Defined in: packages/sessions/src/cassette/replay.ts:247

**`Stable`**

Compute the canonical SHA-256 of any value the cassette layer
accepts as `args`. Mirrors what the writer records under
`sha256OfArgs`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`string`
