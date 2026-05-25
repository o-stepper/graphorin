[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / enforceSecretAcl

# Function: enforceSecretAcl()

```ts
function enforceSecretAcl(key): void;
```

Defined in: packages/security/src/secrets/acl.ts:63

Throw `SecretAccessDeniedError` if a tool context is active and the
key is not in its allowlist. No-op when no tool context is active.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

## Returns

`void`

## Stable
