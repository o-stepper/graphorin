[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowPolicy

# Interface: DataFlowPolicy

Defined in: packages/security/src/dataflow/types.ts:321

**`Stable`**

The data-flow policy engine. Stateless and pure: all run-scoped state
lives in the [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md) the caller threads in via
[DataFlowEvaluation](/api/@graphorin/security/interfaces/DataFlowEvaluation.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode` | `readonly` | [`DataFlowMode`](/api/@graphorin/security/type-aliases/DataFlowMode.md) | The configured mode (mirrors the constructor input). | packages/security/src/dataflow/types.ts:323 |

## Methods

### evaluate()

```ts
evaluate(evaluation): DataFlowDecision;
```

Defined in: packages/security/src/dataflow/types.ts:325

Decide what to do about one candidate sink call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `evaluation` | [`DataFlowEvaluation`](/api/@graphorin/security/interfaces/DataFlowEvaluation.md) |

#### Returns

[`DataFlowDecision`](/api/@graphorin/security/type-aliases/DataFlowDecision.md)
