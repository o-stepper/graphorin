[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / OutboundCommentaryPolicy

# Type Alias: OutboundCommentaryPolicy

```ts
type OutboundCommentaryPolicy = "wrap" | "strip" | "pass-through";
```

Defined in: packages/tools/src/outbound/commentary-patterns.ts:41

**`Stable`**

Operator-facing policy shared by all outbound commentary
sanitizers.

 - `'wrap'` (default) - wraps the matched fragment in a
   `<<<commentary>>>...<<</commentary>>>` envelope so downstream
   consumers can choose to render or hide based on context.
 - `'strip'` - removes the matched fragment entirely.
 - `'pass-through'` - disables the sanitization (operator opt-in
   for trusted deployments).
