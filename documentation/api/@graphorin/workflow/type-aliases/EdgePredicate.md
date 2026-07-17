[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / EdgePredicate

# Type Alias: EdgePredicate\&lt;TState\&gt;

```ts
type EdgePredicate<TState> = (state) => boolean;
```

Defined in: [packages/workflow/src/types.ts:243](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L243)

Predicate evaluated by the engine when deciding which edges to fire.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `Readonly`\&lt;`TState`\&gt; |

## Returns

`boolean`
