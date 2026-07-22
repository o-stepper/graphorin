[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / readRetryAfterMs

# Function: readRetryAfterMs()

```ts
function readRetryAfterMs(err): number | null;
```

Defined in: packages/provider/src/errors/retryability.ts:98

**`Stable`**

Read a `Retry-After` hint from a thrown error. Recognises:

- errors carrying a `retryAfterMs` field (already milliseconds) -
  `RateLimitExceededError` and `ProviderHttpError` with a numeric
  `Retry-After` response header both stamp it;
- errors carrying a `retryAfterSeconds` numeric field;
- HTTP-shaped errors carrying a `headers['retry-after']` value
  (numeric seconds, or an HTTP-date resolved against the current
  clock).

Returns the resolved delay in milliseconds or `null` when no hint
is available. `withRetry` consumes this to honour server-provided
backoff over its own schedule.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

## Returns

`number` \| `null`
