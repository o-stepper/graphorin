[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / PrepareStepHook

# Type Alias: PrepareStepHook\<TDeps\>

```ts
type PrepareStepHook<TDeps> = (ctx) => 
  | Promise<PrepareStepOverrides<TDeps>>
| PrepareStepOverrides<TDeps>;
```

Defined in: packages/agent/src/types.ts:84

Per-step override hook. Receives the current `RunContext` and may
return overrides applied to the next provider call only.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md)\<`TDeps`\> |

## Returns

  \| `Promise`\<[`PrepareStepOverrides`](/api/@graphorin/agent/interfaces/PrepareStepOverrides.md)\<`TDeps`\>\>
  \| [`PrepareStepOverrides`](/api/@graphorin/agent/interfaces/PrepareStepOverrides.md)\<`TDeps`\>

## Stable
