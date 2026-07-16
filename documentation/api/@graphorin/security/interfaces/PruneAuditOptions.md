[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditOptions

# Interface: PruneAuditOptions

Defined in: [packages/security/src/audit/prune.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L49)

Options for `pruneAudit(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `number` \| `Date` | Drop entries older than this Date / epoch ms. Required so the helper never silently truncates the audit chain. | [packages/security/src/audit/prune.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L54) |
| <a id="property-logger"></a> `logger?` | `readonly` | (`event`) => `void` | Optional structured log sink invoked exactly once per prune run. The framework logger ships in a follow-on phase; until then, consumers can wire `console.info` (or a custom logger) here so the operational signal is not lost. | [packages/security/src/audit/prune.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L66) |
| <a id="property-retain"></a> `retain?` | `readonly` | `number` | Minimum number of entries that must survive. The helper refuses to leave the chain emptier than this. Defaults to 1. | [packages/security/src/audit/prune.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L59) |
