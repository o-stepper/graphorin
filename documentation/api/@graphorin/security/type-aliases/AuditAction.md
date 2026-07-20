[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditAction

# Type Alias: AuditAction

```ts
type AuditAction = 
  | "secret:get"
  | "secret:require"
  | "secret:set"
  | "secret:delete"
  | "secret:list"
  | "secret:cross-agent-access"
  | "secrets:downgrade"
  | "token:create"
  | "token:revoke"
  | "token:rotate"
  | "token:rekey"
  | "auth:granted"
  | "auth:denied:unauth"
  | "auth:denied:scope"
  | "auth:denied:lockout"
  | "oauth:granted"
  | "oauth:refreshed"
  | "oauth:revoked"
  | "oauth:registered"
  | "oauth:expired"
  | "skill:installed"
  | "skill:upgraded"
  | "skill:audit"
  | "guardrail:triggered"
  | "memory:sensitivity-downgrade"
  | "memory:modification:before"
  | "memory:modification:after"
  | "memory:guard:snapshot"
  | "memory:guard:verified"
  | "memory:guard:mismatch"
  | "memory:guard:rolled-back"
  | "memory:guard:exceeded-budget"
  | "consolidator:run-started"
  | "consolidator:run-completed"
  | "replay:accessed"
  | "replay:skipped"
  | "audit:db-opened"
  | "audit:pruned"
  | "audit:exported"
  | string & {
};
```

Defined in: packages/security/src/audit/types.ts:34

**`Stable`**

Canonical action discriminator. Listed here as an open string union
so deployments can extend with their own actions without forking
the framework - but the well-known set is documented for tooling
(filter dropdowns, tests, etc.).
