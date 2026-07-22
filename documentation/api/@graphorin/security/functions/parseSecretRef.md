[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseSecretRef

# Function: parseSecretRef()

```ts
function parseSecretRef(uri): ParsedSecretRef;
```

Defined in: packages/security/src/secrets/secret-ref.ts:376

**`Stable`**

Strict RFC 3986-subset parser for `SecretRef` URIs. Rejects every
input that does not conform to the grammar declared in the
architecture spec; never silently falls back to a default scheme.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |

## Returns

[`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md)
