[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryOperationsObservation

# Interface: MemoryOperationsObservation

Defined in: packages/evals/src/loaders/memory-eval.ts:149

**`Stable`**

What the system under test exposes for scoring after replaying one
operation-level case: the observable memory contents post-ingest
plus the QA answer when the case carried a question. Produced by
the replaying harness in `benchmarks/` - this package stays
type-only with respect to `@graphorin/memory`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-answer"></a> `answer?` | `readonly` | `string` | The answer produced for [MemoryOperationsEvalInput.question](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md#property-question). | packages/evals/src/loaders/memory-eval.ts:153 |
| <a id="property-memorypoints"></a> `memoryPoints` | `readonly` | readonly `string`[] | Textual contents of every recall-eligible memory point after ingest. | packages/evals/src/loaders/memory-eval.ts:151 |
