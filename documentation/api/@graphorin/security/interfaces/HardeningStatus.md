[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / HardeningStatus

# Interface: HardeningStatus

Defined in: packages/security/src/hardening/apply.ts:61

**`Stable`**

Snapshot of the current hardening posture. Returned by
`applyProcessHardening(...)` and queryable later via
`getHardeningStatus(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `true` | True only after `applyProcessHardening` ran in this process. | packages/security/src/hardening/apply.ts:70 |
| <a id="property-appliedat"></a> `appliedAt` | `readonly` | `number` | - | packages/security/src/hardening/apply.ts:68 |
| <a id="property-euid"></a> `euid` | `readonly` | `number` \| `undefined` | - | packages/security/src/hardening/apply.ts:63 |
| <a id="property-platform"></a> `platform` | `readonly` | `Platform` | - | packages/security/src/hardening/apply.ts:62 |
| <a id="property-preferfchmod"></a> `preferFchmod` | `readonly` | `boolean` | - | packages/security/src/hardening/apply.ts:67 |
| <a id="property-previousumask"></a> `previousUmask` | `readonly` | `number` | - | packages/security/src/hardening/apply.ts:64 |
| <a id="property-refuseroot"></a> `refuseRoot` | `readonly` | `boolean` | - | packages/security/src/hardening/apply.ts:66 |
| <a id="property-umask"></a> `umask` | `readonly` | `number` | - | packages/security/src/hardening/apply.ts:65 |
