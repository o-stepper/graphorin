[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS

# Variable: DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS

```ts
const DEFAULT_DELIVERY_COMMENTARY_PATTERNS: ReadonlyArray<DeliveryCommentaryPattern> = OUTBOUND_COMMENTARY_PATTERNS;
```

Defined in: packages/server/src/commentary/built-in-patterns.ts:33

**`Stable`**

The framework-shipped catalogue. Snapshot bytes-equal across the
`ws` / `sse` / `rest` transports; idempotent on a single payload
(the wrap envelope itself is not matched by any pattern, so a
second pass over a previously-sanitized payload is a no-op).

Re-exported from the shared `@graphorin/tools/outbound` catalogue
(same array reference).
