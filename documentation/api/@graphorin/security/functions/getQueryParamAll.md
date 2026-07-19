[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getQueryParamAll

# Function: getQueryParamAll()

```ts
function getQueryParamAll(ref, key): readonly string[];
```

Defined in: packages/security/src/secrets/secret-ref.ts:555

**`Stable`**

Read every value associated with `key` in the original query string
(multi-value support). Returns an empty array if the parameter is
not present.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md) |
| `key` | `string` |

## Returns

readonly `string`[]
