[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [reconnect](/api/@graphorin/client/reconnect/index.md) / computeBackoffMs

# Function: computeBackoffMs()

```ts
function computeBackoffMs(attempt, policy?): number | null;
```

Defined in: packages/client/src/reconnect.ts:46

**`Stable`**

Compute the number of milliseconds to sleep before the
`attempt`-th reconnect (1-indexed). Returns `null` when the policy
has been exhausted (`attempt > maxAttempts`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `attempt` | `number` |
| `policy` | [`BackoffPolicy`](/api/@graphorin/client/reconnect/interfaces/BackoffPolicy.md) |

## Returns

`number` \| `null`
