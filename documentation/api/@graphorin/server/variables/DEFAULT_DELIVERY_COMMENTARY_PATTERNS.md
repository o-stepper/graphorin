[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS

# Variable: DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS

```ts
const DEFAULT_DELIVERY_COMMENTARY_PATTERNS: ReadonlyArray<DeliveryCommentaryPattern>;
```

Defined in: [packages/server/src/commentary/built-in-patterns.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/built-in-patterns.ts#L28)

The framework-shipped catalogue. Snapshot bytes-equal across the
`ws` / `sse` / `rest` transports; idempotent on a single payload
(the wrap envelope itself is not matched by any pattern, so a
second pass over a previously-sanitized payload is a no-op).

## Stable
