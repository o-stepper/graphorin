[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryGuardAuditAction

# Type Alias: MemoryGuardAuditAction

```ts
type MemoryGuardAuditAction = 
  | "memory:modification:before"
  | "memory:modification:after"
  | "memory:guard:snapshot"
  | "memory:guard:verified"
  | "memory:guard:mismatch"
  | "memory:guard:rolled-back"
  | "memory:guard:exceeded-budget";
```

Defined in: packages/security/src/guard/audit-emitter.ts:34

**`Stable`**

Discriminator for `MemoryGuardAuditEvent` variants. The audit log
stores the values verbatim under the canonical
`<resource>:<action>` convention.

Two layers of action names coexist by design:

 - `memory:modification:before` and `memory:modification:after` are
   the canonical audit-log entries called out by the
   `AUDIT_ONLY_GUARD` and `STRICT_FULL_GUARD` specifications
   (DEC-153). Every snapshot / verify cycle emits exactly one
   `before` and one `after` row so SIEM dashboards can pair them.
 - The `memory:guard:*` family carries the more granular
   discriminator (`snapshot`, `verified`, `mismatch`,
   `rolled-back`, `exceeded-budget`) for telemetry consumers that
   want to filter by outcome without re-reading the metadata.
