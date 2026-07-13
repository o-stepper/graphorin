[**Graphorin API reference v0.9.0**](../../../index.md)

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

Defined in: [packages/security/src/auth/audit-emitter.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L18)

Discriminator for `AuthAuditEvent`. The `token:*` actions cover the
CRUD lifecycle; `auth:granted` / `auth:denied:*` cover verification
outcomes.

## Stable
