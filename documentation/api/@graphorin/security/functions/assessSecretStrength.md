[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / assessSecretStrength

# Function: assessSecretStrength()

```ts
function assessSecretStrength(bytes, options?): SecretStrength;
```

Defined in: [packages/security/src/hardening/weak-secret.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/weak-secret.ts#L51)

Assess the strength of a raw secret buffer. Pure: callers decide
whether to throw or WARN on `ok === false`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `options` | [`SecretStrengthOptions`](/api/@graphorin/security/interfaces/SecretStrengthOptions.md) |

## Returns

[`SecretStrength`](/api/@graphorin/security/interfaces/SecretStrength.md)

## Stable
