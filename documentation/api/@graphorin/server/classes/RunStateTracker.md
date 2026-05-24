[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateTracker

# Class: RunStateTracker

Defined in: packages/server/src/runtime/run-state.ts:106

Pluggable tracker. The default in-memory implementation is the only
one shipped in Phase 14a; future phases plug in a SQLite-backed
variant so durable resume survives process restarts.

## Stable

## Constructors

### Constructor

```ts
new RunStateTracker(options?): RunStateTracker;
```

Defined in: packages/server/src/runtime/run-state.ts:110

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `now?`: () => `number`; \} |
| `options.now?` | () => `number` |

#### Returns

`RunStateTracker`

## Methods

### abort()

```ts
abort(runId, reason?): boolean;
```

Defined in: packages/server/src/runtime/run-state.ts:167

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

Defined in: packages/server/src/runtime/run-state.ts:267

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

Defined in: packages/server/src/runtime/run-state.ts:236

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

Defined in: packages/server/src/runtime/run-state.ts:152

Mark a run as terminal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `status` | `"aborted"` \| `"completed"` \| `"failed"` |
| `err?` | `unknown` |

#### Returns

`void`

***

### declare()

```ts
declare(runId, descriptor): void;
```

Defined in: packages/server/src/runtime/run-state.ts:115

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

Defined in: packages/server/src/runtime/run-state.ts:209

Number of runs currently in `pending` or `running`. Useful for
snapshots / metrics. Note that `pending` runs hold a reservation
but have not yet started any work — see [runningCount](/api/@graphorin/server/classes/RunStateTracker.md#runningcount) for
the drain-blocking subset.

#### Returns

`number`

***

### prune()

```ts
prune(olderThan): number;
```

Defined in: packages/server/src/runtime/run-state.ts:250

Drop terminal records older than `olderThan`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `olderThan` | `number` |

#### Returns

`number`

***

### runningCount()

```ts
runningCount(): number;
```

Defined in: packages/server/src/runtime/run-state.ts:223

Number of runs with active work in progress (`running`). The
lifecycle drain blocks on this counter only — pending runs are a
pure reservation (e.g. an awaited WS subscription) and can be
aborted immediately when SIGTERM arrives.

#### Returns

`number`

***

### snapshot()

```ts
snapshot(runId): 
  | RunStateSnapshot
  | undefined;
```

Defined in: packages/server/src/runtime/run-state.ts:181

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

Defined in: packages/server/src/runtime/run-state.ts:128

Promote a previously-declared run to `running` (or declare it).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | [`RunDescriptor`](/api/@graphorin/server/type-aliases/RunDescriptor.md) |

#### Returns

[`RunHandle`](/api/@graphorin/server/interfaces/RunHandle.md)
