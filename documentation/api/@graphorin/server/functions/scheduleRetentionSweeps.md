[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / scheduleRetentionSweeps

# Function: scheduleRetentionSweeps()

```ts
function scheduleRetentionSweeps(options): () => void;
```

Defined in: [packages/server/src/runtime/retention.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L186)

W-010: schedule the periodic retention sweep. Same lifecycle shape
as `scheduleRunPruning`: `unref`-ed `setInterval` + a stop function.
The FIRST sweep runs immediately on scheduling - a server that is
restarted more often than `intervalMs` would otherwise never prune
anything. Each surface is isolated in its own try/catch: one failing
prune logs a WARN and never blocks the others. Overlapping sweeps
are skipped (the previous sweep still running when the timer fires
again is a signal the interval is too tight, not a reason to pile
up writers).

Returns a stop function; with `config.enabled === false` no timer is
created and the stop function is a no-op.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ScheduleRetentionOptions`](/api/@graphorin/server/interfaces/ScheduleRetentionOptions.md) |

## Returns

() => `void`

## Stable
