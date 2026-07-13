[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generateBootstrapToken

# Function: generateBootstrapToken()

```ts
function generateBootstrapToken(): string;
```

Defined in: [packages/security/src/hardening/crypto.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/crypto.ts#L38)

Generate a 256-bit bootstrap token encoded with base62url. Always
emits `BOOTSTRAP_TOKEN_LENGTH` (43) characters. Source entropy is
`crypto.randomBytes(32)` per DEC-135 - never `crypto.randomUUID()`
(only 122 bits).

## Returns

`string`

## Stable
