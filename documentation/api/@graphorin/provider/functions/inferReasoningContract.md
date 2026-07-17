[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / inferReasoningContract

# Function: inferReasoningContract()

```ts
function inferReasoningContract(input): ReasoningContract;
```

Defined in: [packages/provider/src/reasoning/classify-contract.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/reasoning/classify-contract.ts#L75)

Return the canonical [ReasoningContract](/api/@graphorin/core/type-aliases/ReasoningContract.md) for a model id, or
`'optional'` for unknown / Ollama / OpenAI-compatible families.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`InferReasoningContractInput`](/api/@graphorin/provider/interfaces/InferReasoningContractInput.md) |

## Returns

[`ReasoningContract`](/api/@graphorin/core/type-aliases/ReasoningContract.md)

## Stable
