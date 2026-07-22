[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [ws](/api/@graphorin/server/ws/index.md) / scheduleReplayBufferPruning

# Function: scheduleReplayBufferPruning()

```ts
function scheduleReplayBufferPruning(buffer, opts?): () => void;
```

Defined in: packages/server/src/ws/replay-buffer.ts:197

**`Stable`**

Schedule a periodic [ReplayBuffer.prune](/api/@graphorin/server/interfaces/ReplayBuffer.md#prune) sweep. Without
it TTL expiry only ran lazily inside `push`/`replay`/`size` FOR THE
SAME SUBJECT, so every finished run-subject (a fresh runId per run)
retained up to `maxEvents` full payloads forever on a long-living
server. Mirrors `scheduleRunPruning`: `unref`-ed timer,
returns a stop function. The sweep applies only the already
documented TTL - replay semantics inside the TTL window are
unchanged (an immediate `forget` on run completion would break
short-disconnect resume of terminal events).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `buffer` | [`ReplayBuffer`](/api/@graphorin/server/interfaces/ReplayBuffer.md) |
| `opts` | \{ `intervalMs?`: `number`; \} |
| `opts.intervalMs?` | `number` |

## Returns

() => `void`
