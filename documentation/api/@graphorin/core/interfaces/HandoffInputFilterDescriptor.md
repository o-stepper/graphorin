[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / HandoffInputFilterDescriptor

# Interface: HandoffInputFilterDescriptor

Defined in: packages/core/src/types/handoff.ts:54

**`Stable`**

Stable, serializable description of the input filter applied to a
handoff. Persisted alongside `HandoffRecord` and round-tripped through
the JSONL session export so a replay can re-construct the filter
stack even after the runtime filter implementations evolve.

The discriminator `kind` is an open string union - well-known kinds
include `'full' | 'last-n' | 'last-user' | 'summary' |
'sensitivity-filter' | 'compose' | 'custom'`. The accompanying `meta`
carries kind-specific data (for example `{ n: 10 }` for `'last-n'`,
`{ summary: '...' }` for `'summary'`, or
`{ messagesPassedCount, strippedReasoningCount, ... }` summary stats
for `'compose'`). New kinds may be added freely; consumers must not
assume an exhaustive switch.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `string` | packages/core/src/types/handoff.ts:55 |
| <a id="property-meta"></a> `meta?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/types/handoff.ts:56 |
