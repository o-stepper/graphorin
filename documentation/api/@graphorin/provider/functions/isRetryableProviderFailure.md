[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / isRetryableProviderFailure

# Function: isRetryableProviderFailure()

```ts
function isRetryableProviderFailure(err): boolean;
```

Defined in: packages/provider/src/errors/retryability.ts:66

**`Stable`**

Classify a thrown provider error as retryable (also
fallback-eligible) or terminal.

Decision order:

1. Non-object throws are never retryable.
2. An aborted request is never retryable, even when it surfaces as
   a `status: 0` network error. The retry loop also
   short-circuits on `req.signal?.aborted`, but the predicate must
   exclude abort independently so an internally-aborted call is not
   retried.
3. The canonical kind decides when recognised. `ProviderHttpError.kind`
   is always the stable `'provider-http'` discriminant; the mapped
   canonical kind rides on `errorKind` - both are consulted.
   Transient kinds (`transient`, `rate-limit`, `rate-limit-exceeded`,
   `capacity`) are retryable; terminal kinds (`unauthorized`,
   `invalid-request`, `context-length`, `content-filter`) are not.
4. HTTP status fallback for errors without a recognised kind:
   `429` and `5xx` retry; `status: 0` is a fetch-level network
   failure (ECONNREFUSED, DNS, connection reset, request timeout) -
   exactly the transient class `withRetry` documents - and retries
   (abort already excluded above).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

## Returns

`boolean`
