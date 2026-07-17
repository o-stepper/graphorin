[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / encodeBase62Integer

# Function: encodeBase62Integer()

```ts
function encodeBase62Integer(value, width): string;
```

Defined in: [packages/security/src/auth/token-format.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/token-format.ts#L162)

Encode a non-negative integer (≤ 2^53 - 1) as base62. The output is
left-padded with `'0'` to the requested width. Throws on negative,
non-finite, or width-exceeding inputs to avoid silent truncation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |
| `width` | `number` |

## Returns

`string`

## Stable
