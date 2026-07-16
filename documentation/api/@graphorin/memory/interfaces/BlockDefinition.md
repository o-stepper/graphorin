[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / BlockDefinition

# Interface: BlockDefinition

Defined in: [packages/memory/src/tiers/working-memory.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L45)

Frozen block definition returned by [defineBlock](/api/@graphorin/memory/functions/defineBlock.md). Re-used by
the agent runtime / context engine to know which blocks should be
compiled into the system prompt every step.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-charlimit"></a> `charLimit` | `readonly` | `number` | [packages/memory/src/tiers/working-memory.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L49) |
| <a id="property-defaultvalue"></a> `defaultValue?` | `readonly` | `string` | [packages/memory/src/tiers/working-memory.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L52) |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [packages/memory/src/tiers/working-memory.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L47) |
| <a id="property-label"></a> `label` | `readonly` | `string` | [packages/memory/src/tiers/working-memory.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L46) |
| <a id="property-overflowpolicy"></a> `overflowPolicy` | `readonly` | `"truncate"` \| `"reject"` | [packages/memory/src/tiers/working-memory.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L53) |
| <a id="property-readonly"></a> `readOnly` | `readonly` | `boolean` | [packages/memory/src/tiers/working-memory.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L51) |
| <a id="property-schema"></a> `schema?` | `readonly` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`unknown`, `unknown`\&gt; | [packages/memory/src/tiers/working-memory.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L48) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | [packages/memory/src/tiers/working-memory.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L50) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [packages/memory/src/tiers/working-memory.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/working-memory.ts#L54) |
