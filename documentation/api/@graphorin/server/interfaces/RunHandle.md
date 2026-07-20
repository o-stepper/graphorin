[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunHandle

# Interface: RunHandle

Defined in: packages/server/src/runtime/run-state.ts:135

**`Stable`**

In-flight handle returned by [RunStateTracker.start](/api/@graphorin/server/classes/RunStateTracker.md#start). Handlers
pass `signal` into the underlying `agent.run / workflow.execute`
invocation so cancellation propagates instantly.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:136 |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | packages/server/src/runtime/run-state.ts:137 |

## Methods

### cancel()

```ts
cancel(reason?): void;
```

Defined in: packages/server/src/runtime/run-state.ts:138

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `unknown` |

#### Returns

`void`
