[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / registerAuditDbBinding

# Function: registerAuditDbBinding()

```ts
function registerAuditDbBinding(binding, opts?): () => void;
```

Defined in: packages/security/src/audit/audit-db.ts:139

**`Stable`**

Register a concrete binding. The framework default
(`better-sqlite3-multiple-ciphers`) is registered by
`@graphorin/store-sqlite`; downstream consumers can register a
custom binding before calling `openAuditDb(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`AuditDbBinding`](/api/@graphorin/security/interfaces/AuditDbBinding.md) |
| `opts` | \{ `setAsDefault?`: `boolean`; \} |
| `opts.setAsDefault?` | `boolean` |

## Returns

() => `void`
