[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / BUILT\_IN\_COMMENTARY\_PATTERNS

# Variable: BUILT\_IN\_COMMENTARY\_PATTERNS

```ts
const BUILT_IN_COMMENTARY_PATTERNS: ReadonlyArray<CommentaryPattern> = OUTBOUND_COMMENTARY_PATTERNS;
```

Defined in: packages/sessions/src/commentary/built-in-patterns.ts:38

**`Stable`**

The framework-shipped catalogue. Snapshot bytes-equal across
boundaries; idempotent on a single content part (the wrap envelope
itself is not matched by any pattern).

Re-exported from the shared `@graphorin/tools/outbound` catalogue
(same array reference).
