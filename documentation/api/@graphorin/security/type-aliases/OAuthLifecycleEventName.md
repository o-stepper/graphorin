[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthLifecycleEventName

# Type Alias: OAuthLifecycleEventName

```ts
type OAuthLifecycleEventName = 
  | "oauth.granted"
  | "oauth.refreshed"
  | "oauth.revoked"
  | "oauth.registered"
  | "mcp.auth.expired";
```

Defined in: packages/security/src/oauth/events.ts:15

**`Stable`**

Discriminator for `OAuthLifecycleEvent`.
