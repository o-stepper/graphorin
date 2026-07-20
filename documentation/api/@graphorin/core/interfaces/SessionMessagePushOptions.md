[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMessagePushOptions

# Interface: SessionMessagePushOptions

Defined in: packages/core/src/contracts/memory-store.ts:128

**`Stable`**

Optional per-message write metadata. `verdict` is the
turn's security verdict from the run loop's commit gates
(`RunState.verdicts`); persisted so the memory ingest gate can
exclude guardrail-blocked turns from extraction deterministically.
Additive third argument (arity precedent: `forget(id, reason?,
scope?)`); widen-only semantics like `ToolReturn.taint`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-verdict"></a> `verdict?` | `readonly` | [`RunTurnVerdict`](/api/@graphorin/core/interfaces/RunTurnVerdict.md) | packages/core/src/contracts/memory-store.ts:129 |
