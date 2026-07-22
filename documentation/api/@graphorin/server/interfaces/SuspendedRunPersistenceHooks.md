[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SuspendedRunPersistenceHooks

# Interface: SuspendedRunPersistenceHooks

Defined in: packages/server/src/runtime/run-state.ts:171

**`Stable`**

Persistence delegate for suspended (`awaiting_approval`) runs. The
tracker itself stays in-memory and synchronous; the delegate mirrors
every suspension into a durable sidecar and drops it when the run
settles, so `POST /runs/:runId/resume` survives a process restart.

Both hooks are fire-and-forget from the tracker's point of view:
implementations must never throw (the tracker additionally guards)
and own their async error handling.

## Methods

### settled()

```ts
settled(runId): void;
```

Defined in: packages/server/src/runtime/run-state.ts:187

A previously-suspended run settled through resume (completed,
failed, or aborted mid-resume) - drop the durable row. NOT invoked
from [RunStateTracker.abort](/api/@graphorin/server/classes/RunStateTracker.md#abort): the graceful-shutdown path
force-aborts every run, and erasing parked approvals there would
defeat restart survival. The REST abort route deletes its row
explicitly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`void`

***

### suspended()

```ts
suspended(
   runId, 
   descriptor, 
   state): void;
```

Defined in: packages/server/src/runtime/run-state.ts:178

A run parked (or re-parked) on durable HITL. `state` is either the
live resumable RunState (in-process suspension) or the raw
serialized-state STRING (boot re-registration of a persisted row -
persist it verbatim).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | [`RunDescriptor`](/api/@graphorin/server/type-aliases/RunDescriptor.md) |
| `state` | `unknown` |

#### Returns

`void`
