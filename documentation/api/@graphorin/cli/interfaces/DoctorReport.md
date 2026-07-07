[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorReport

# Interface: DoctorReport

Defined in: [packages/cli/src/commands/doctor.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L79)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | `readonly` | readonly [`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[] | [packages/cli/src/commands/doctor.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L83) |
| <a id="property-fixedperms"></a> `fixedPerms?` | `readonly` | readonly `string`[] | [packages/cli/src/commands/doctor.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L90) |
| <a id="property-home"></a> `home` | `readonly` | `string` | [packages/cli/src/commands/doctor.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L81) |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | [packages/cli/src/commands/doctor.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L82) |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `fail`: `number`; `ok`: `number`; `skip`: `number`; `warn`: `number`; \} | [packages/cli/src/commands/doctor.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L84) |
| `summary.fail` | `readonly` | `number` | [packages/cli/src/commands/doctor.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L87) |
| `summary.ok` | `readonly` | `number` | [packages/cli/src/commands/doctor.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L85) |
| `summary.skip` | `readonly` | `number` | [packages/cli/src/commands/doctor.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L88) |
| `summary.warn` | `readonly` | `number` | [packages/cli/src/commands/doctor.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L86) |
| <a id="property-version"></a> `version` | `readonly` | `string` | [packages/cli/src/commands/doctor.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L80) |
