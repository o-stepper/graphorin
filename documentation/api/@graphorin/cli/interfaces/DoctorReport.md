[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorReport

# Interface: DoctorReport

Defined in: packages/cli/src/commands/doctor.ts:79

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | `readonly` | readonly [`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[] | packages/cli/src/commands/doctor.ts:83 |
| <a id="property-fixedperms"></a> `fixedPerms?` | `readonly` | readonly `string`[] | packages/cli/src/commands/doctor.ts:90 |
| <a id="property-home"></a> `home` | `readonly` | `string` | packages/cli/src/commands/doctor.ts:81 |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | packages/cli/src/commands/doctor.ts:82 |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `fail`: `number`; `ok`: `number`; `skip`: `number`; `warn`: `number`; \} | packages/cli/src/commands/doctor.ts:84 |
| `summary.fail` | `readonly` | `number` | packages/cli/src/commands/doctor.ts:87 |
| `summary.ok` | `readonly` | `number` | packages/cli/src/commands/doctor.ts:85 |
| `summary.skip` | `readonly` | `number` | packages/cli/src/commands/doctor.ts:88 |
| `summary.warn` | `readonly` | `number` | packages/cli/src/commands/doctor.ts:86 |
| <a id="property-version"></a> `version` | `readonly` | `string` | packages/cli/src/commands/doctor.ts:80 |
