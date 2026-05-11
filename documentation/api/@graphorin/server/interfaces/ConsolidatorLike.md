[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorLike

# Interface: ConsolidatorLike

Defined in: packages/server/src/consolidator/daemon.ts:21

Structurally-typed view of the `@graphorin/memory` Consolidator
surface. Importing the full type would force a hard dependency on
`@graphorin/memory`; the structural subset captured here is enough
for the lifecycle integration + the `/v1/health` aggregator.

## Stable

## Methods

### drainDlq()?

```ts
optional drainDlq(): Promise<number>;
```

Defined in: packages/server/src/consolidator/daemon.ts:28

#### Returns

`Promise`\&lt;`number`\&gt;

***

### pause()?

```ts
optional pause(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:26

#### Returns

`Promise`\&lt;`void`\&gt;

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
