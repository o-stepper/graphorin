[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorReport

# Interface: DoctorReport

Defined in: [packages/cli/src/commands/doctor.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L89)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | `readonly` | readonly [`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[] | - | [packages/cli/src/commands/doctor.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L95) |
| <a id="property-configpath"></a> `configPath?` | `readonly` | `string` | Resolved config path when `--config` drove the perms check. | [packages/cli/src/commands/doctor.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L93) |
| <a id="property-fixedperms"></a> `fixedPerms?` | `readonly` | readonly `string`[] | - | [packages/cli/src/commands/doctor.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L102) |
| <a id="property-home"></a> `home` | `readonly` | `string` | - | [packages/cli/src/commands/doctor.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L91) |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | - | [packages/cli/src/commands/doctor.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L94) |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `fail`: `number`; `ok`: `number`; `skip`: `number`; `warn`: `number`; \} | - | [packages/cli/src/commands/doctor.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L96) |
| `summary.fail` | `readonly` | `number` | - | [packages/cli/src/commands/doctor.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L99) |
| `summary.ok` | `readonly` | `number` | - | [packages/cli/src/commands/doctor.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L97) |
| `summary.skip` | `readonly` | `number` | - | [packages/cli/src/commands/doctor.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L100) |
| `summary.warn` | `readonly` | `number` | - | [packages/cli/src/commands/doctor.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L98) |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | [packages/cli/src/commands/doctor.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L90) |
