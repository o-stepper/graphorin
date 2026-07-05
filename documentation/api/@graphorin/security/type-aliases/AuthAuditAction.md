[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthAuditAction

# Type Alias: AuthAuditAction

```ts
type AuthAuditAction = 
  | "token:create"
  | "token:revoke"
  | "token:rotate"
  | "token:rekey"
  | "auth:granted"
  | "auth:denied:unauth"
  | "auth:denied:scope"
  | "auth:denied:lockout";
```

Defined in: packages/security/src/auth/audit-emitter.ts:18

Discriminator for `AuthAuditEvent`. The `token:*` actions cover the
CRUD lifecycle; `auth:granted` / `auth:denied:*` cover verification
outcomes.

## Stable
