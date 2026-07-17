[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditAction

# Type Alias: OAuthAuditAction

```ts
type OAuthAuditAction = 
  | "oauth:granted"
  | "oauth:refreshed"
  | "oauth:revoked"
  | "oauth:registered"
  | "oauth:expired";
```

Defined in: [packages/security/src/oauth/audit-emitter.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L16)

Discriminator for `OAuthAuditEvent`. Variants follow the
`<resource>:<action>` convention used throughout the audit log.

## Stable
