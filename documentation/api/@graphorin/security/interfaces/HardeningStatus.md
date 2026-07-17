[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / HardeningStatus

# Interface: HardeningStatus

Defined in: [packages/security/src/hardening/apply.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L61)

Snapshot of the current hardening posture. Returned by
`applyProcessHardening(...)` and queryable later via
`getHardeningStatus(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `true` | True only after `applyProcessHardening` ran in this process. | [packages/security/src/hardening/apply.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L70) |
| <a id="property-appliedat"></a> `appliedAt` | `readonly` | `number` | - | [packages/security/src/hardening/apply.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L68) |
| <a id="property-euid"></a> `euid` | `readonly` | `number` \| `undefined` | - | [packages/security/src/hardening/apply.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L63) |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | - | [packages/security/src/hardening/apply.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L62) |
| <a id="property-preferfchmod"></a> `preferFchmod` | `readonly` | `boolean` | - | [packages/security/src/hardening/apply.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L67) |
| <a id="property-previousumask"></a> `previousUmask` | `readonly` | `number` | - | [packages/security/src/hardening/apply.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L64) |
| <a id="property-refuseroot"></a> `refuseRoot` | `readonly` | `boolean` | - | [packages/security/src/hardening/apply.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L66) |
| <a id="property-umask"></a> `umask` | `readonly` | `number` | - | [packages/security/src/hardening/apply.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L65) |
