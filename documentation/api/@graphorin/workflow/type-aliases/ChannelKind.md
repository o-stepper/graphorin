[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ChannelKind

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

Defined in: packages/core/dist/channels/channels.d.ts:14

**`Stable`**

Workflow channel kinds. Every state field declared on a workflow's
`stateSchema` is bound to a channel that decides the merge strategy
applied when multiple writers update the same field within a single
execution step.

The names are **Graphorin's own design** and must not be aliased to
terms from other workflow libraries. A dedicated lint rule lands later
in the release line to enforce this.
