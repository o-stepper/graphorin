[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorDaemon

# Interface: ConsolidatorDaemon

Defined in: [packages/server/src/consolidator/daemon.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L76)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | [packages/server/src/consolidator/daemon.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L80) |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L77)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ConsolidatorStatusLike>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L79)

#### Returns

`Promise`\&lt;[`ConsolidatorStatusLike`](/api/@graphorin/server/interfaces/ConsolidatorStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L78)

#### Returns

`Promise`\&lt;`void`\&gt;
