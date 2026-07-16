[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorDaemon

# Interface: ConsolidatorDaemon

Defined in: [packages/server/src/consolidator/daemon.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L84)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | [packages/server/src/consolidator/daemon.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L88) |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L85)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ConsolidatorStatusLike>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L87)

#### Returns

`Promise`\&lt;[`ConsolidatorStatusLike`](/api/@graphorin/server/interfaces/ConsolidatorStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/consolidator/daemon.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L86)

#### Returns

`Promise`\&lt;`void`\&gt;
