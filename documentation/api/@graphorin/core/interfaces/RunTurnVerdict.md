[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunTurnVerdict

# Interface: RunTurnVerdict

Defined in: packages/core/src/types/run.ts:244

**`Stable`**

One turn's security verdict. All fields are optional
and additive; the ABSENCE of a verdict entry means the turn passed
every gate untouched.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dataflowflags"></a> `dataflowFlags?` | `readonly` | readonly `string`[] | Data-flow policy findings attached to this turn (e.g. flagged sink flows). Bounded descriptive labels, never content. | packages/core/src/types/run.ts:253 |
| <a id="property-guardrail"></a> `guardrail?` | `readonly` | `"block"` \| `"rewrite"` | An input/output guardrail blocked or rewrote this turn. | packages/core/src/types/run.ts:246 |
| <a id="property-lateralleak"></a> `lateralLeak?` | `readonly` | `boolean` | The lateral-leak defense withheld this assistant turn. | packages/core/src/types/run.ts:248 |
