[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorReport

# Interface: DoctorReport

Defined in: packages/cli/src/commands/doctor.ts:121

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | `readonly` | readonly [`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[] | - | packages/cli/src/commands/doctor.ts:127 |
| <a id="property-configpath"></a> `configPath?` | `readonly` | `string` | Resolved config path when `--config` drove the perms check. | packages/cli/src/commands/doctor.ts:125 |
| <a id="property-fixedperms"></a> `fixedPerms?` | `readonly` | readonly `string`[] | - | packages/cli/src/commands/doctor.ts:134 |
| <a id="property-home"></a> `home` | `readonly` | `string` | - | packages/cli/src/commands/doctor.ts:123 |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | - | packages/cli/src/commands/doctor.ts:126 |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `fail`: `number`; `ok`: `number`; `skip`: `number`; `warn`: `number`; \} | - | packages/cli/src/commands/doctor.ts:128 |
| `summary.fail` | `readonly` | `number` | - | packages/cli/src/commands/doctor.ts:131 |
| `summary.ok` | `readonly` | `number` | - | packages/cli/src/commands/doctor.ts:129 |
| `summary.skip` | `readonly` | `number` | - | packages/cli/src/commands/doctor.ts:132 |
| `summary.warn` | `readonly` | `number` | - | packages/cli/src/commands/doctor.ts:130 |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | packages/cli/src/commands/doctor.ts:122 |
