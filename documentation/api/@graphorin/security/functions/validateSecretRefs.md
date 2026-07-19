[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / validateSecretRefs

# Function: validateSecretRefs()

```ts
function validateSecretRefs(config, opts?): SecretRefValidationResult;
```

Defined in: packages/security/src/secrets/secret-ref.ts:584

**`Stable`**

Walks an arbitrary configuration object and validates every `*Ref`
field. Returns a structured result rather than throwing, so callers
can collect every issue before deciding to bail out.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `unknown` |
| `opts` | [`ValidateSecretRefsOptions`](/api/@graphorin/security/interfaces/ValidateSecretRefsOptions.md) |

## Returns

[`SecretRefValidationResult`](/api/@graphorin/security/interfaces/SecretRefValidationResult.md)
