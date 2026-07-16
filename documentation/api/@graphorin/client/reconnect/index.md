[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / reconnect

# reconnect

Pure-functional reconnect-backoff helper. Encapsulated in its own
module so the `GraphorinClient` stays free of timing
heuristics - and so tests can drive the policy with a deterministic
RNG.

Algorithm: exponential backoff with full-jitter
(`delay = random(0, min(maxMs, baseMs * 2^(attempt-1)))`). The
implementation matches the AWS Architecture Blog "exponential
backoff and jitter" reference but is otherwise an original
formulation.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [BackoffPolicy](/api/@graphorin/client/reconnect/interfaces/BackoffPolicy.md) | Stable shape consumed by [computeBackoffMs](/api/@graphorin/client/reconnect/functions/computeBackoffMs.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [computeBackoffMs](/api/@graphorin/client/reconnect/functions/computeBackoffMs.md) | Compute the number of milliseconds to sleep before the `attempt`-th reconnect (1-indexed). Returns `null` when the policy has been exhausted (`attempt > maxAttempts`). |
| [sleep](/api/@graphorin/client/reconnect/functions/sleep.md) | Resolve when the requested number of milliseconds elapsed, or reject (with a `DOMException`-style abort error) when the supplied `AbortSignal` fires first. |
