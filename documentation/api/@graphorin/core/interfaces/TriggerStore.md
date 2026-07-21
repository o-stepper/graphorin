[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TriggerStore

# Interface: TriggerStore

Defined in: packages/core/src/contracts/trigger-store.ts:34

**`Stable`**

Pluggable persistent storage for triggers. Default impl lives in
`@graphorin/store-sqlite`.

## Methods

### get()

```ts
get(id): Promise<
  | TriggerState
| null>;
```

Defined in: packages/core/src/contracts/trigger-store.ts:36

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)
  \| `null`\>

***

### list()

```ts
list(): Promise<readonly TriggerState[]>;
```

Defined in: packages/core/src/contracts/trigger-store.ts:37

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

***

### recordFire()

```ts
recordFire(
   id, 
   firedAt, 
nextFireAt?): Promise<void>;
```

Defined in: packages/core/src/contracts/trigger-store.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `firedAt` | `string` |
| `nextFireAt?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### remove()

```ts
remove(id): Promise<void>;
```

Defined in: packages/core/src/contracts/trigger-store.ts:38

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### upsert()

```ts
upsert(state): Promise<void>;
```

Defined in: packages/core/src/contracts/trigger-store.ts:35

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
