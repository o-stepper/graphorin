[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Channel

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

Defined in: packages/core/src/channels/channels.ts:31

**`Stable`**

Discriminated union of every channel descriptor.

Channels are a *description* of the merge strategy, not a runtime
value: the engine reads the `kind` field plus optional auxiliary
fields (`reduce`, `from`, `unique`) to decide how to combine writes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
