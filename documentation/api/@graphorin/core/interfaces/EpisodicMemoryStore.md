[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EpisodicMemoryStore

# Interface: EpisodicMemoryStore

Defined in: [packages/core/src/contracts/memory-store.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L147)

## Stable

## Extended by

- [`EpisodicMemoryStoreExt`](/api/@graphorin/memory/interfaces/EpisodicMemoryStoreExt.md)

## Methods

### get()

```ts
get(id): Promise<Episode | null>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L153)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md) \| `null`\&gt;

***

### put()

```ts
put(episode): Promise<void>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L148)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `episode` | [`Episode`](/api/@graphorin/core/interfaces/Episode.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L149)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\&gt;[]\>
