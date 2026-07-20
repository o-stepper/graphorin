[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getQueryParamRequired

# Function: getQueryParamRequired()

```ts
function getQueryParamRequired(ref, key): string;
```

Defined in: packages/security/src/secrets/secret-ref.ts:536

**`Stable`**

Read a query parameter and throw if it is missing. Useful for
resolver implementations that require a configuration value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md) |
| `key` | `string` |

## Returns

`string`
