[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SideEffectClass

# Type Alias: SideEffectClass

```ts
type SideEffectClass = "pure" | "read-only" | "side-effecting" | "external-stateful";
```

Defined in: packages/core/src/types/tool.ts:59

**`Stable`**

Side-effect classification declared by a tool author.

Surfaced uniformly by the tool dispatcher, downstream session
cassette layers, retry middleware, and approval-policy derivations.

- `'pure'`              - deterministic; same `(input, ctx)` always
  yields the same output; no I/O of any kind.
- `'read-only'`         - queries external systems but never
  mutates them (e.g. database SELECT, HTTP GET).
- `'side-effecting'`    - mutates state inside the agent's logical
  boundary (e.g. memory writes, cache writes).
- `'external-stateful'` - mutates state outside the agent's
  boundary that other systems can observe (e.g. issue creation,
  message dispatch, payment).
