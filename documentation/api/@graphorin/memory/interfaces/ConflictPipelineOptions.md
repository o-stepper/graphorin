[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictPipelineOptions

# Interface: ConflictPipelineOptions

Defined in: [packages/memory/src/conflict/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L127)

Pipeline configuration accepted by `createMemory({ conflictPipeline:
... })` and surfaced through [createConflictPipeline](/api/@graphorin/memory/functions/createConflictPipeline.md).

The `mode` field is the master switch:

 - `'on'` (default) - the multi-stage pipeline runs on every
   `SemanticMemory.remember(...)` call.
 - `'off'` - bypass the pipeline and fall back to 10a's straight-
   through write. Emits a one-shot WARN (per process) so operators
   notice the regression risk.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictstore"></a> `conflictStore?` | `readonly` | [`ConflictMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConflictMemoryStoreExt.md) | Override the audit / pending sink. Defaults to `store.conflicts` when present. | [packages/memory/src/conflict/types.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L134) |
| <a id="property-localepack"></a> `localePack?` | `readonly` | [`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md) | - | [packages/memory/src/conflict/types.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L130) |
| <a id="property-mode"></a> `mode?` | `readonly` | `"on"` \| `"off"` | - | [packages/memory/src/conflict/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L128) |
| <a id="property-now"></a> `now?` | `readonly` | () => `string` | Inject a deterministic clock. Defaults to `() => new Date().toISOString()`. | [packages/memory/src/conflict/types.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L136) |
| <a id="property-stage2topk"></a> `stage2TopK?` | `readonly` | `number` | Per-list candidate count fed into Stage 2. Default `5` (RB-02 §8.1). | [packages/memory/src/conflict/types.ts:132](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L132) |
| <a id="property-thresholds"></a> `thresholds?` | `readonly` | `Partial`\&lt;[`ConflictThresholds`](/api/@graphorin/memory/interfaces/ConflictThresholds.md)\&gt; | - | [packages/memory/src/conflict/types.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L129) |
