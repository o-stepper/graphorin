[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getQueryParam

# Function: getQueryParam()

```ts
function getQueryParam(ref, key): string | undefined;
```

Defined in: [packages/security/src/secrets/secret-ref.ts:526](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-ref.ts#L526)

Read a single query parameter from a parsed ref. Returns `undefined`
if the parameter is not present.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md) |
| `key` | `string` |

## Returns

`string` \| `undefined`

## Stable
