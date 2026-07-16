[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditOnlyGuardOptions

# Interface: AuditOnlyGuardOptions

Defined in: [packages/security/src/guard/audit-only-guard.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/audit-only-guard.ts#L27)

Options for `createAuditOnlyGuard(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`MemoryGuardActor`](/api/@graphorin/security/interfaces/MemoryGuardActor.md) | Optional actor pointer surfaced through audit events. | [packages/security/src/guard/audit-only-guard.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/audit-only-guard.ts#L29) |
