[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditDbBindingId

# Type Alias: AuditDbBindingId

```ts
type AuditDbBindingId = 
  | "better-sqlite3-multiple-ciphers"
  | string & {
};
```

Defined in: packages/security/src/audit/audit-db.ts:34

**`Stable`**

Stored binding identifier. The framework default is the
`better-sqlite3-multiple-ciphers` package - registered by
`@graphorin/store-sqlite` at startup. Custom enterprise deployments
can register their own binding here without touching the secrets
layer.
