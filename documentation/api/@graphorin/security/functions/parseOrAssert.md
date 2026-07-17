[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseOrAssert

# Function: parseOrAssert()

```ts
function parseOrAssert(input): ParsedSecretRef;
```

Defined in: [packages/security/src/secrets/secret-ref.ts:692](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-ref.ts#L692)

Convenience: parse if the input looks like a URI, otherwise throw a
`naked-string` parse error. Used by `resolveSecret(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

## Returns

[`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md)

## Stable
