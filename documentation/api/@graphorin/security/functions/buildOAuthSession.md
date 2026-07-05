[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / buildOAuthSession

# Function: buildOAuthSession()

```ts
function buildOAuthSession(
   serverId, 
   body, 
   override?): OAuthSession;
```

Defined in: packages/security/src/oauth/authorize-code-flow.ts:187

Construct an [OAuthSession](/api/@graphorin/security/interfaces/OAuthSession.md) from a successful token-endpoint
payload. Exported for the device + refresh flows so they share a
single mapping path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `serverId` | `string` |
| `body` | [`TokenEndpointBody`](/api/@graphorin/security/interfaces/TokenEndpointBody.md) |
| `override?` | \{ `issuedAt?`: `number`; \} |
| `override.issuedAt?` | `number` |

## Returns

[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)

## Stable
