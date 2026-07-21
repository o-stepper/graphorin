[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / MergeBiasDecision

# Interface: MergeBiasDecision

Defined in: packages/agent/src/lateral-leak/merge-guard.ts:101

**`Stable`**

Pure decision returned by [evaluateMerge](/api/@graphorin/agent/functions/evaluateMerge.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-biased"></a> `biased` | `readonly` | `boolean` | packages/agent/src/lateral-leak/merge-guard.ts:102 |
| <a id="property-contributionweight"></a> `contributionWeight?` | `readonly` | `number` | packages/agent/src/lateral-leak/merge-guard.ts:104 |
| <a id="property-decision"></a> `decision` | `readonly` | `"block"` \| `"flag"` \| `"pass-through"` | packages/agent/src/lateral-leak/merge-guard.ts:106 |
| <a id="property-offendingchild"></a> `offendingChild?` | `readonly` | `string` | packages/agent/src/lateral-leak/merge-guard.ts:103 |
| <a id="property-sourcetrust"></a> `sourceTrust?` | `readonly` | `number` | packages/agent/src/lateral-leak/merge-guard.ts:105 |
