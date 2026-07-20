[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / OUTBOUND\_COMMENTARY\_PATTERNS

# Variable: OUTBOUND\_COMMENTARY\_PATTERNS

```ts
const OUTBOUND_COMMENTARY_PATTERNS: ReadonlyArray<OutboundCommentaryPattern>;
```

Defined in: packages/tools/src/outbound/commentary-patterns.ts:97

**`Stable`**

The framework-shipped catalogue: the seven event-shape signatures
the agent runtime can emit which, if leaked into user-visible
text, disclose internal tool execution detail. Bytes-equal across
every boundary that consumes it; idempotent on a single payload
(the wrap envelope itself is not matched by any pattern, so a
second pass over previously-sanitized output is a no-op).
