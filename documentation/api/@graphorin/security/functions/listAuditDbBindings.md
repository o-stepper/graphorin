[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listAuditDbBindings

# Function: listAuditDbBindings()

```ts
function listAuditDbBindings(): readonly {
  description: string;
  id: AuditDbBindingId;
  isDefault: boolean;
}[];
```

Defined in: [packages/security/src/audit/audit-db.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/audit-db.ts#L159)

Snapshot of the binding registry. Used by `graphorin doctor` once
the CLI ships.

## Returns

readonly \{
  `description`: `string`;
  `id`: [`AuditDbBindingId`](/api/@graphorin/security/type-aliases/AuditDbBindingId.md);
  `isDefault`: `boolean`;
\}[]

## Stable
