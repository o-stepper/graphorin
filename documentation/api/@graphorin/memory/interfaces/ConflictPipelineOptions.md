[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictPipelineOptions

# Interface: ConflictPipelineOptions

Defined in: packages/memory/src/conflict/types.ts:127

**`Stable`**

Pipeline configuration accepted by `createMemory({ conflictPipeline:
... })` and surfaced through [createConflictPipeline](/api/@graphorin/memory/functions/createConflictPipeline.md).

The `mode` field is the master switch:

 - `'on'` (default) - the multi-stage pipeline runs on every
   `SemanticMemory.remember(...)` call.
 - `'off'` - bypass the pipeline and fall back to 10a's straight-
   through write. Emits a one-shot WARN (per process) so operators
   notice the regression risk.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictstore"></a> `conflictStore?` | `readonly` | [`ConflictMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConflictMemoryStoreExt.md) | Override the audit / pending sink. Defaults to `store.conflicts` when present. | packages/memory/src/conflict/types.ts:134 |
| <a id="property-localepack"></a> `localePack?` | `readonly` | [`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md) | - | packages/memory/src/conflict/types.ts:130 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"on"` \| `"off"` | - | packages/memory/src/conflict/types.ts:128 |
| <a id="property-now"></a> `now?` | `readonly` | () => `string` | Inject a deterministic clock. Defaults to `() => new Date().toISOString()`. | packages/memory/src/conflict/types.ts:136 |
| <a id="property-stage2topk"></a> `stage2TopK?` | `readonly` | `number` | Per-list candidate count fed into Stage 2. Default `5` (RB-02 §8.1). | packages/memory/src/conflict/types.ts:132 |
| <a id="property-thresholds"></a> `thresholds?` | `readonly` | `Partial`\&lt;[`ConflictThresholds`](/api/@graphorin/memory/interfaces/ConflictThresholds.md)\&gt; | - | packages/memory/src/conflict/types.ts:129 |
