[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenFormatErrorKind

# Type Alias: TokenFormatErrorKind

```ts
type TokenFormatErrorKind = 
  | "empty-input"
  | "wrong-prefix"
  | "wrong-version"
  | "wrong-length"
  | "invalid-environment"
  | "invalid-entropy"
  | "invalid-checksum";
```

Defined in: [packages/security/src/auth/errors.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L17)

Discriminator union for `TokenFormatError`. Lets callers branch on
the concrete failure mode without parsing the message string.

## Stable
