[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getDefaultAuditDbBinding

# Function: getDefaultAuditDbBinding()

```ts
function getDefaultAuditDbBinding(): 
  | AuditDbBindingId
  | undefined;
```

Defined in: [packages/security/src/audit/audit-db.ts:181](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/audit-db.ts#L181)

Read the identifier of the active default binding. Returns
`undefined` if no binding has been registered.

## Returns

  \| [`AuditDbBindingId`](/api/@graphorin/security/type-aliases/AuditDbBindingId.md)
  \| `undefined`

## Stable
