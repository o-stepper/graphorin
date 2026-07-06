[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / EdgePredicate

# Type Alias: EdgePredicate\<TState\>

```ts
type EdgePredicate<TState> = (state) => boolean;
```

Defined in: packages/workflow/src/types.ts:243

Predicate evaluated by the engine when deciding which edges to fire.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `Readonly`\<`TState`\> |

## Returns

`boolean`
