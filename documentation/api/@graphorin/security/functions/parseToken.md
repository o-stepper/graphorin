[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseToken

# Function: parseToken()

```ts
function parseToken(input, opts?): ParsedToken;
```

Defined in: packages/security/src/auth/token-format.ts:261

Strict structural parser. Returns a discriminated union so callers
can branch on `ok` without throwing on the hot path. The function
never logs the raw input; the error class only carries the input
length.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `opts` | [`ParseTokenOptions`](/api/@graphorin/security/interfaces/ParseTokenOptions.md) |

## Returns

[`ParsedToken`](/api/@graphorin/security/type-aliases/ParsedToken.md)

## Stable
