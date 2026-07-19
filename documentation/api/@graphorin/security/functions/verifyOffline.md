[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyOffline

# Function: verifyOffline()

```ts
function verifyOffline(input, opts?): 
  | {
  env: string;
  ok: true;
}
  | {
  ok: false;
  reason: string;
};
```

Defined in: packages/security/src/auth/token-format.ts:393

**`Stable`**

Cheap structural pre-filter used before doing any HMAC or DB work.
Identical to `parseToken` but returns the boolean shape that the
verify pipeline expects.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `opts` | [`ParseTokenOptions`](/api/@graphorin/security/interfaces/ParseTokenOptions.md) |

## Returns

  \| \{
  `env`: `string`;
  `ok`: `true`;
\}
  \| \{
  `ok`: `false`;
  `reason`: `string`;
\}
