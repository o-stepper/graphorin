[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorLike

# Interface: ConsolidatorLike

Defined in: packages/server/src/consolidator/daemon.ts:21

**`Stable`**

Structurally-typed view of the `@graphorin/memory` Consolidator
surface. Importing the full type would force a hard dependency on
`@graphorin/memory`; the structural subset captured here is enough
for the lifecycle integration + the `/v1/health` aggregator.

## Methods

### drainDlq()?

```ts
optional drainDlq(): Promise<number>;
```

Defined in: packages/server/src/consolidator/daemon.ts:28

#### Returns

`Promise`\&lt;`number`\&gt;

***

### notifyActivity()?

```ts
optional notifyActivity(): Promise<unknown>;
```

Defined in: packages/server/src/consolidator/daemon.ts:44

Activity signal - a tracked run settled, the
transcript may have grown. The server's run tracker calls this so
a configured `buffer:N` trigger is re-evaluated against the
unconsolidated tail. Optional: older consolidator surfaces simply
opt out.

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### pause()?

```ts
optional pause(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:26

#### Returns

`Promise`\&lt;`void`\&gt;

***

### registerWithScheduler()?

```ts
optional registerWithScheduler(scheduler): Promise<unknown>;
```

Defined in: packages/server/src/consolidator/daemon.ts:36

Register the consolidator's cron / idle triggers with the server's
triggers scheduler so background consolidation actually fires.
Called from `beforeStart` when both a consolidator and a triggers daemon
are configured. Optional so a consolidator without a `defaultScope` (or a
custom surface) simply opts out.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scheduler` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### resume()?

```ts
optional resume(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:27

#### Returns

`Promise`\&lt;`void`\&gt;

***

### setTier()?

```ts
optional setTier(tier): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:25

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:22

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ConsolidatorStatusLike>;
```

Defined in: packages/server/src/consolidator/daemon.ts:24

#### Returns

`Promise`\&lt;[`ConsolidatorStatusLike`](/api/@graphorin/server/interfaces/ConsolidatorStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:23

#### Returns

`Promise`\&lt;`void`\&gt;
