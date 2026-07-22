[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / normalizeOpUri

# Function: normalizeOpUri()

```ts
function normalizeOpUri(raw): string;
```

Defined in: packages/secret-1password/src/resolver.ts:164

**`Stable`**

Lowercase the authority + path segments of an `op://` URI so two
configs that differ only in case resolve to the same value (matching
1Password's case-insensitive behaviour).

Exposed for tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

`string`
