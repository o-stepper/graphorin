[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AnyTool

# Type Alias: AnyTool\&lt;TDeps\&gt;

```ts
type AnyTool<TDeps> = Tool<any, any, TDeps>;
```

Defined in: [packages/core/src/contracts/tool.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L200)

Existentially-typed [Tool](/api/@graphorin/core/interfaces/Tool.md) for collection seams (W-100).

`Tool` is invariant in `TInput` (the `needsApproval` /
`idempotencyKey` predicate properties are contravariant in it), so a
concretely-typed `Tool<{ q: string }, number, D>` is NOT assignable
to `Tool<unknown, unknown, D>` - which forced `as unknown as Tool`
casts wherever tools are collected. `AnyTool` erases `TInput` /
`TOutput` existentially, following the `HandoffEntry` precedent in
`@graphorin/agent`.

Use it on COLLECTION seams (`createAgent({ tools })`, executor
options, registries); implement tools against the typed `Tool` via
the `tool({...})` factory.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Stable
