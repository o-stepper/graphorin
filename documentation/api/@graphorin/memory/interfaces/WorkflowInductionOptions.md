[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / WorkflowInductionOptions

# Interface: WorkflowInductionOptions

Defined in: [packages/memory/src/consolidator/phases/induce.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L92)

Per-call options for an induction request.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Output-token ceiling. Default [DEFAULT\_INDUCTION\_MAX\_TOKENS](/api/@graphorin/memory/variables/DEFAULT_INDUCTION_MAX_TOKENS.md). | [packages/memory/src/consolidator/phases/induce.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L94) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/memory/src/consolidator/phases/induce.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L95) |
