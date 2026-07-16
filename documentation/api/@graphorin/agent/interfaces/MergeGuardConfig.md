[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / MergeGuardConfig

# Interface: MergeGuardConfig

Defined in: [packages/agent/src/lateral-leak/merge-guard.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L56)

Per-agent guard configuration accepted by
`createAgent({ mergeGuard })`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-lowtrustthreshold"></a> `lowTrustThreshold?` | `readonly` | `number` | Default `0.5`. | [packages/agent/src/lateral-leak/merge-guard.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L61) |
| <a id="property-maxlowtrustweight"></a> `maxLowTrustWeight?` | `readonly` | `number` | Default `0.3`. | [packages/agent/src/lateral-leak/merge-guard.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L59) |
| <a id="property-sourcetrustoverrides"></a> `sourceTrustOverrides?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Operator overrides for known agent ids. | [packages/agent/src/lateral-leak/merge-guard.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L63) |
| <a id="property-strictness"></a> `strictness` | `readonly` | `"off"` \| `"detect"` \| `"detect-and-flag"` \| `"detect-and-block"` | - | [packages/agent/src/lateral-leak/merge-guard.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L57) |
