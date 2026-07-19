[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / NodeRunResult

# Type Alias: NodeRunResult\&lt;TState\&gt;

```ts
type NodeRunResult<TState> = 
  | undefined
  | Partial<TState>
  | DispatchLike
  | ReadonlyArray<
  | DispatchLike
| Partial<TState>>;
```

Defined in: packages/workflow/src/types.ts:221

**`Stable`**

Permissible return shapes from a node's `run(...)` callback.

- `undefined` - the node performed a side effect with no state writes.
- `Partial<TState>` - channel writes (one entry per channel).
- `Dispatch | Dispatch[]` - schedule additional tasks for the next
  execution step (see [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md)).
- `(Partial<TState> | Dispatch)[]` - mix of writes and dispatches
  produced in a single call.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |
