[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / BlockSpec

# Interface: BlockSpec

Defined in: packages/memory/src/tiers/working-memory.ts:17

Author-time block specification accepted by
[defineBlock](/api/@graphorin/memory/functions/defineBlock.md) and [WorkingMemory.define](/api/@graphorin/memory/classes/WorkingMemory.md#define).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-charlimit"></a> `charLimit` | `readonly` | `number` | Maximum length of the rendered value in characters. | packages/memory/src/tiers/working-memory.ts:22 |
| <a id="property-defaultvalue"></a> `defaultValue?` | `readonly` | `string` | Per-block default value. Applied on first definition only; later runs preserve any value already in storage. | packages/memory/src/tiers/working-memory.ts:31 |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | packages/memory/src/tiers/working-memory.ts:19 |
| <a id="property-label"></a> `label` | `readonly` | `string` | - | packages/memory/src/tiers/working-memory.ts:18 |
| <a id="property-overflowpolicy"></a> `overflowPolicy?` | `readonly` | `"truncate"` \| `"reject"` | Default `'truncate'` - `'reject'` opt-in for strict use cases. | packages/memory/src/tiers/working-memory.ts:33 |
| <a id="property-readonly"></a> `readOnly?` | `readonly` | `boolean` | Default `false`. | packages/memory/src/tiers/working-memory.ts:26 |
| <a id="property-schema"></a> `schema?` | `readonly` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`unknown`, `unknown`\&gt; | - | packages/memory/src/tiers/working-memory.ts:20 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default `'internal'`. | packages/memory/src/tiers/working-memory.ts:24 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Optional free-form labels surfaced through `tags`. | packages/memory/src/tiers/working-memory.ts:35 |
