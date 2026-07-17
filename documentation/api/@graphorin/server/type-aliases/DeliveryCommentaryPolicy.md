[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryPolicy

# Type Alias: DeliveryCommentaryPolicy

```ts
type DeliveryCommentaryPolicy = "wrap" | "strip" | "pass-through";
```

Defined in: [packages/server/src/commentary/types.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L33)

Operator-facing policy. Identical semantics to the session-output
sanitizer in `@graphorin/sessions/commentary` so the two layers
are bytes-equal on idempotent re-application.

 - `'wrap'` (default) - wraps the matched fragment in a
   `<<<commentary>>>...<<</commentary>>>` envelope so downstream
   consumers can choose to render or hide based on context.
 - `'strip'` - removes the matched fragment entirely.
 - `'pass-through'` - disables the sanitization (operator opt-in
   for trusted deployments).

## Stable
