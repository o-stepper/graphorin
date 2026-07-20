[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generatePkceVerifier

# Function: generatePkceVerifier()

```ts
function generatePkceVerifier(byteLength?): string;
```

Defined in: packages/security/src/oauth/pkce.ts:32

**`Stable`**

Generate a cryptographically random PKCE code verifier. The output
is URL-safe base64 (43-128 chars per the spec).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `byteLength` | `number` | `DEFAULT_VERIFIER_BYTES` |

## Returns

`string`
