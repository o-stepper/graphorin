[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / Consolidator

# Interface: Consolidator

Defined in: packages/memory/src/consolidator/runtime.ts:74

Consolidator runtime surface returned by [createConsolidator](/api/@graphorin/memory/functions/createConsolidator.md).
Compatible with the placeholder shape so the facade can swap the
implementation without breaking consumers.

## Stable

## Methods

### config()

```ts
config(): ConsolidatorConfig;
```

Defined in: packages/memory/src/consolidator/runtime.ts:99

Active config - frozen snapshot.

#### Returns

[`ConsolidatorConfig`](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md)

***

### drainDlq()

```ts
drainDlq(scope): Promise<number>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:112

Drain DLQ rows whose `nextRetryAt` <= now.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### fireNow()

```ts
fireNow(phase, scope?): Promise<
  | PhaseOutcome
| null>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:83

Manual trigger for the requested phase. Skips phase gating + the
idle/cron scheduler so admins can flush the queue on demand.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `phase` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<
  \| [`PhaseOutcome`](/api/@graphorin/memory/interfaces/PhaseOutcome.md)
  \| `null`\>

***

### isFree()

```ts
isFree(): boolean;
```

Defined in: packages/memory/src/consolidator/runtime.ts:110

True when `tier === 'free'`.

#### Returns

`boolean`

***

### onPhaseFinished()

```ts
onPhaseFinished(listener): () => void;
```

Defined in: packages/memory/src/consolidator/runtime.ts:91

Subscribe to phase-finished notifications. Returns an unsubscribe.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`PhaseListener`](/api/@graphorin/memory/type-aliases/PhaseListener.md) |

#### Returns

() => `void`

***

### pause()

```ts
pause(): Promise<void>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:87

Pause the consolidator until the next budget reset.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordExternalSpend()

```ts
recordExternalSpend(tokens, costUsd?): void;
```

Defined in: packages/memory/src/consolidator/runtime.ts:97

Record memory-pipeline LLM spend that happened OUTSIDE a phase run
(MCON-15 - e.g. workflow induction) so the daily ceilings cover it.
Counted under the deep-phase bucket.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tokens` | `number` |
| `costUsd?` | `number` |

#### Returns

`void`

***

### registerWithScheduler()

```ts
registerWithScheduler(scheduler): Promise<RegisterTriggersResult>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:108

Register this consolidator's cron / idle triggers with a
`@graphorin/triggers` scheduler so they fire `trigger(...)`
automatically (the daemon ↔ triggers bridge - MCON-4). Uses the
configured `defaultScope`; throws if none was set. Turn / event
triggers are skipped (consumer-emitted). The standalone server calls
this in `beforeStart`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scheduler` | [`SchedulerLike`](/api/@graphorin/memory/interfaces/SchedulerLike.md) |

#### Returns

`Promise`\&lt;[`RegisterTriggersResult`](/api/@graphorin/memory/interfaces/RegisterTriggersResult.md)\&gt;

***

### resume()

```ts
resume(): Promise<void>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:89

Resume after `pause()`.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### setTier()

```ts
setTier(tier): Promise<void>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:85

Replace the active tier - recomputes ceilings + phase set.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:75

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ConsolidatorStatus>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:78

#### Returns

`Promise`\&lt;[`ConsolidatorStatus`](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:76

#### Returns

`Promise`\&lt;`void`\&gt;

***

### trigger()

```ts
trigger(reason, scope): Promise<
  | PhaseOutcome
| null>;
```

Defined in: packages/memory/src/consolidator/runtime.ts:77

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | [`ConsolidatorTriggerReason`](/api/@graphorin/memory/interfaces/ConsolidatorTriggerReason.md) |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<
  \| [`PhaseOutcome`](/api/@graphorin/memory/interfaces/PhaseOutcome.md)
  \| `null`\>
