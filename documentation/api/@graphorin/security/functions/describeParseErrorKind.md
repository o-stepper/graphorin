[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / describeParseErrorKind

# Function: describeParseErrorKind()

```ts
function describeParseErrorKind(kind): string;
```

Defined in: [packages/security/src/secrets/secret-ref.ts:696](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-ref.ts#L696)

Map `SecretRefParseErrorKind` to a human-friendly string. Useful for
diagnostic messages in `graphorin doctor --check-secrets`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`SecretRefParseErrorKind`](/api/@graphorin/security/type-aliases/SecretRefParseErrorKind.md) |

## Returns

`string`

## Stable
