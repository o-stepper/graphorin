[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorDaemon

# Interface: ConsolidatorDaemon

Defined in: packages/server/src/consolidator/daemon.ts:76

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | packages/server/src/consolidator/daemon.ts:80 |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:77

#### Returns

`Promise`\<`void`\>

***

### status()

```ts
status(): Promise<ConsolidatorStatusLike>;
```

Defined in: packages/server/src/consolidator/daemon.ts:79

#### Returns

`Promise`\<[`ConsolidatorStatusLike`](/api/@graphorin/server/interfaces/ConsolidatorStatusLike.md)\>

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/consolidator/daemon.ts:78

#### Returns

`Promise`\<`void`\>
