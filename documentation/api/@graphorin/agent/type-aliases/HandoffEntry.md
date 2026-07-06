[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / HandoffEntry

# Type Alias: HandoffEntry\&lt;TDeps\&gt;

```ts
type HandoffEntry<TDeps> = 
  | Agent<TDeps, any>
  | {
  inputFilter?: HandoffFilter;
  target: Agent<TDeps, any>;
};
```

Defined in: packages/agent/src/types.ts:127

Handoff target entry accepted by `createAgent({ handoffs })`.
Either a bare [Agent](/api/@graphorin/agent/interfaces/Agent.md) reference (default filter applied) or
an explicit `{ target, inputFilter? }` envelope.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Stable
