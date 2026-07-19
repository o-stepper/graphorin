[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / OutboundCommentaryPolicy

# Type Alias: OutboundCommentaryPolicy

```ts
type OutboundCommentaryPolicy = "wrap" | "strip" | "pass-through";
```

Defined in: [packages/tools/dist/outbound/commentary-patterns.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/outbound/commentary-patterns.d.ts)

**`Stable`**

Operator-facing policy shared by all outbound commentary
sanitizers.

 - `'wrap'` (default) - wraps the matched fragment in a
   `<<<commentary>>>...<<</commentary>>>` envelope so downstream
   consumers can choose to render or hide based on context.
 - `'strip'` - removes the matched fragment entirely.
 - `'pass-through'` - disables the sanitization (operator opt-in
   for trusted deployments).
