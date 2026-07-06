[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditDbBindingId

# Type Alias: AuditDbBindingId

```ts
type AuditDbBindingId = 
  | "better-sqlite3-multiple-ciphers"
  | string & {
};
```

Defined in: [packages/security/src/audit/audit-db.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/audit-db.ts#L34)

Stored binding identifier. The framework default is the
`better-sqlite3-multiple-ciphers` package - registered by
`@graphorin/store-sqlite` at startup. Custom enterprise deployments
can register their own binding here without touching the secrets
layer.

## Stable
