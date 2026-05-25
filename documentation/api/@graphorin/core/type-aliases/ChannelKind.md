[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ChannelKind

# Type Alias: ChannelKind

```ts
type ChannelKind = 
  | "latest-value"
  | "any-value"
  | "reducer"
  | "list-aggregate"
  | "stream"
  | "barrier"
  | "ephemeral";
```

Defined in: packages/core/src/channels/channels.ts:13

Workflow channel kinds. Every state field declared on a workflow's
`stateSchema` is bound to a channel that decides the merge strategy
applied when multiple writers update the same field within a single
execution step.

The names are **Graphorin's own design** and must not be aliased to
terms from other workflow libraries. A dedicated lint rule lands later
in the release line to enforce this.

## Stable
