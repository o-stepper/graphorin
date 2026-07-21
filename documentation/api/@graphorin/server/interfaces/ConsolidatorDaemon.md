[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorDaemon

# Interface: ConsolidatorDaemon

Defined in: packages/server/src/consolidator/daemon.ts:84

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | packages/server/src/consolidator/daemon.ts:88 |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:85

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ConsolidatorStatusLike>;
```

Defined in: packages/server/src/consolidator/daemon.ts:87

#### Returns

`Promise`\&lt;[`ConsolidatorStatusLike`](/api/@graphorin/server/interfaces/ConsolidatorStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:86

#### Returns

`Promise`\&lt;`void`\&gt;
