[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentaryPolicy

# Type Alias: CommentaryPolicy

```ts
type CommentaryPolicy = "wrap" | "strip" | "pass-through";
```

Defined in: packages/sessions/src/commentary/types.ts:22

**`Stable`**

Operator-facing policy for handling detected commentary fragments.

 - `'wrap'` (default) wraps every detection in a
   `<<<commentary>>>...<<</commentary>>>` envelope so downstream
   consumers can choose to render or hide based on context.
 - `'strip'` removes the detected fragment entirely.
 - `'pass-through'` disables the sanitization (operator opt-in for
   deployments that handle commentary at a different layer).
