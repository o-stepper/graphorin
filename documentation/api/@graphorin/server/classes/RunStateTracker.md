[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateTracker

# Class: RunStateTracker

Defined in: packages/server/src/runtime/run-state.ts:198

**`Stable`**

Pluggable tracker. Bookkeeping is in-memory; wire
[RunStateTracker.setSuspendedRunPersistence](/api/@graphorin/server/classes/RunStateTracker.md#setsuspendedrunpersistence) to make suspended
runs durable across process restarts (the standalone server does, on
top of `store.suspendedRuns`).

## Constructors

### Constructor

```ts
new RunStateTracker(options?): RunStateTracker;
```

Defined in: packages/server/src/runtime/run-state.ts:205

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | \{ `now?`: () => `number`; `onTerminal?`: (`info`) => `void`; \} | - |
| `options.now?` | () => `number` | - |
| `options.onTerminal?` | (`info`) => `void` | Invoked exactly once per run, the first time it settles into a terminal state. Used to drive the run-count + duration metrics. Never throws into the tracker - wrap your handler if it might. |

#### Returns

`RunStateTracker`

## Methods

### abort()

```ts
abort(runId, reason?): boolean;
```

Defined in: packages/server/src/runtime/run-state.ts:393

Cancel a run via its `AbortController`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `reason?` | `unknown` |

#### Returns

`boolean`

***

### abortAll()

```ts
abortAll(reason?): number;
```

Defined in: packages/server/src/runtime/run-state.ts:505

Cancel every in-flight run. Used during graceful shutdown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `unknown` |

#### Returns

`number`

***

### abortPending()

```ts
abortPending(reason?): number;
```

Defined in: packages/server/src/runtime/run-state.ts:469

Drop every reserved-but-not-yet-started run. Called by the
server lifecycle at the start of `stop()` so the drain only
waits for actual work in flight.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `unknown` |

#### Returns

`number`

***

### complete()

```ts
complete(
   runId, 
   status, 
   err?): void;
```

Defined in: packages/server/src/runtime/run-state.ts:319

Mark a run as terminal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `status` | `"completed"` \| `"failed"` \| `"aborted"` |
| `err?` | `unknown` |

#### Returns

`void`

***

### declare()

```ts
declare(runId, descriptor): void;
```

Defined in: packages/server/src/runtime/run-state.ts:281

Reserve a run id without taking ownership of an AbortSignal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | [`RunDescriptor`](/api/@graphorin/server/type-aliases/RunDescriptor.md) |

#### Returns

`void`

***

### inflightCount()

```ts
inflightCount(): number;
```

Defined in: packages/server/src/runtime/run-state.ts:442

Number of runs currently in `pending` or `running`. Useful for
snapshots / metrics. Note that `pending` runs hold a reservation
but have not yet started any work - see [runningCount](/api/@graphorin/server/classes/RunStateTracker.md#runningcount) for
the drain-blocking subset.

#### Returns

`number`

***

### prune()

```ts
prune(olderThan): number;
```

Defined in: packages/server/src/runtime/run-state.ts:484

Drop terminal records older than `olderThan`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `olderThan` | `number` |

#### Returns

`number`

***

### registerSuspended()

```ts
registerSuspended(
   runId, 
   descriptor, 
   state): void;
```

Defined in: packages/server/src/runtime/run-state.ts:372

Register an EXTERNALLY-suspended run (e.g. a proactive fire
that ran in-process, outside the REST surface) so the messenger's
`POST /runs/:runId/resume` can find and resume it. Declares the
record when unknown; no activity events (the run never "started"
server-side).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | [`RunDescriptor`](/api/@graphorin/server/type-aliases/RunDescriptor.md) |
| `state` | `unknown` |

#### Returns

`void`

***

### runningCount()

```ts
runningCount(): number;
```

Defined in: packages/server/src/runtime/run-state.ts:456

Number of runs with active work in progress (`running`). The
lifecycle drain blocks on this counter only - pending runs are a
pure reservation (e.g. an awaited WS subscription) and can be
aborted immediately when SIGTERM arrives.

#### Returns

`number`

***

### setActivityListener()

```ts
setActivityListener(listener): void;
```

Defined in: packages/server/src/runtime/run-state.ts:229

Register the server-side activity listener. The
tracker is the single choke point every REST/WS run passes
through, so this is where the server bridges "a run started /
settled" into `scheduler.recordActivity()` (idle debounce) and
`consolidator.notifyActivity()` (buffer:N evaluation). One
listener slot - `createServer` owns it; exceptions are swallowed
so a bridge failure can never break run tracking.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | ((`event`) => `void`) \| `undefined` |

#### Returns

`void`

***

### setSuspendedRunPersistence()

```ts
setSuspendedRunPersistence(hooks): void;
```

Defined in: packages/server/src/runtime/run-state.ts:246

Register the suspended-run persistence delegate (one slot -
`createServer` owns it). Exceptions are swallowed so a durability
bridge failure can never break run tracking.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hooks` | \| [`SuspendedRunPersistenceHooks`](/api/@graphorin/server/interfaces/SuspendedRunPersistenceHooks.md) \| `undefined` |

#### Returns

`void`

***

### snapshot()

```ts
snapshot(runId): 
  | RunStateSnapshot
  | undefined;
```

Defined in: packages/server/src/runtime/run-state.ts:414

Read-only snapshot, safe to JSON.stringify.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

  \| [`RunStateSnapshot`](/api/@graphorin/server/interfaces/RunStateSnapshot.md)
  \| `undefined`

***

### start()

```ts
start(runId, descriptor): RunHandle;
```

Defined in: packages/server/src/runtime/run-state.ts:294

Promote a previously-declared run to `running` (or declare it).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | [`RunDescriptor`](/api/@graphorin/server/type-aliases/RunDescriptor.md) |

#### Returns

[`RunHandle`](/api/@graphorin/server/interfaces/RunHandle.md)

***

### suspend()

```ts
suspend(runId, state): void;
```

Defined in: packages/server/src/runtime/run-state.ts:356

Park a run whose agent suspended on durable HITL. The
tracker retains the resumable `RunState` (opaque) so the REST
resume endpoint can re-enter the agent loop in-process. Emits the
`run-end` activity (active work stopped) but NOT the terminal
metric - the run is not over.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `state` | `unknown` |

#### Returns

`void`

***

### suspendedStateOf()

```ts
suspendedStateOf(runId): unknown;
```

Defined in: packages/server/src/runtime/run-state.ts:388

Peek the retained suspended state. `undefined` when none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`unknown`
