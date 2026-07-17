[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunHandle

# Interface: RunHandle

Defined in: [packages/server/src/runtime/run-state.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L135)

In-flight handle returned by [RunStateTracker.start](/api/@graphorin/server/classes/RunStateTracker.md#start). Handlers
pass `signal` into the underlying `agent.run / workflow.execute`
invocation so cancellation propagates instantly.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L136) |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | [packages/server/src/runtime/run-state.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L137) |

## Methods

### cancel()

```ts
cancel(reason?): void;
```

Defined in: [packages/server/src/runtime/run-state.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L138)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `unknown` |

#### Returns

`void`
