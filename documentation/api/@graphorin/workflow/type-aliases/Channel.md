[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Channel

# Type Alias: Channel\&lt;T\&gt;

```ts
type Channel<T> = 
  | LatestValue<T>
  | AnyValue<T>
  | Reducer<T>
  | ListAggregate<T>
  | Stream<T>
  | Barrier<T>
| Ephemeral<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

**`Stable`**

Discriminated union of every channel descriptor.

Channels are a *description* of the merge strategy, not a runtime
value: the engine reads the `kind` field plus optional auxiliary
fields (`reduce`, `from`, `unique`) to decide how to combine writes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
