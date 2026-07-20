[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / describeParseErrorKind

# Function: describeParseErrorKind()

```ts
function describeParseErrorKind(kind): string;
```

Defined in: packages/security/src/secrets/secret-ref.ts:703

**`Stable`**

Map `SecretRefParseErrorKind` to a human-friendly string. Useful for
diagnostic messages in `graphorin doctor --check-secrets`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`SecretRefParseErrorKind`](/api/@graphorin/security/type-aliases/SecretRefParseErrorKind.md) |

## Returns

`string`
