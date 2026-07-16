[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / FromTracesOptions

# Interface: FromTracesOptions\&lt;I, O\&gt;

Defined in: [packages/evals/src/loaders/from-traces.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L24)

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description surfaced in `Dataset.metadata.description`. | [packages/evals/src/loaders/from-traces.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L30) |
| <a id="property-extract"></a> `extract` | `readonly` | (`events`) => \| [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\> \| `null` | Distil one `Case<I, O>` from every group of events sharing a `runId`. | [packages/evals/src/loaders/from-traces.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L26) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name surfaced in `Dataset.metadata.name`. | [packages/evals/src/loaders/from-traces.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L28) |
