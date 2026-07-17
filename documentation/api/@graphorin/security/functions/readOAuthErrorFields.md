[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / readOAuthErrorFields

# Function: readOAuthErrorFields()

```ts
function readOAuthErrorFields(json): Promise<{
  error?: string;
  error_description?: string;
}>;
```

Defined in: [packages/security/src/oauth/errors.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/errors.ts#L110)

Best-effort read of the RFC 6749/7591 `error` / `error_description` fields
from a non-2xx OAuth JSON response. Never throws (a malformed or empty body
yields `{}`), so the caller can still surface the HTTP status when the server
returns no spec body (OAUTH-ADV-01/02).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `json` | () => `Promise`\&lt;`unknown`\&gt; |

## Returns

`Promise`\<\{
  `error?`: `string`;
  `error_description?`: `string`;
\}\>

## Stable
