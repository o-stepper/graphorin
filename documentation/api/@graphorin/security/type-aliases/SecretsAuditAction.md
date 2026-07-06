[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsAuditAction

# Type Alias: SecretsAuditAction

```ts
type SecretsAuditAction = 
  | "secret:get"
  | "secret:require"
  | "secret:set"
  | "secret:delete"
  | "secret:list"
  | "secrets:downgrade";
```

Defined in: [packages/security/src/secrets/audit-emitter.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L17)

Discriminator for `SecretsAuditEvent`. Every variant follows the
`<resource>:<action>` convention used throughout the audit log.

## Stable
