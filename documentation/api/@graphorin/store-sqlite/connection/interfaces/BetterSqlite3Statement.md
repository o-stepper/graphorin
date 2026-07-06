[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / BetterSqlite3Statement

# Interface: BetterSqlite3Statement

Defined in: packages/store-sqlite/src/driver-types.ts:51

**`Internal`**

Subset of the `better-sqlite3` prepared-statement surface used by
the store.

## Methods

### all()

```ts
all<T>(...params): T[];
```

Defined in: packages/store-sqlite/src/driver-types.ts:54

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

`T`[]

***

### bind()

```ts
bind(...params): this;
```

Defined in: packages/store-sqlite/src/driver-types.ts:59

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

`this`

***

### expand()

```ts
expand(toggle?): this;
```

Defined in: packages/store-sqlite/src/driver-types.ts:58

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toggle?` | `boolean` |

#### Returns

`this`

***

### finalize()?

```ts
optional finalize(): void;
```

Defined in: packages/store-sqlite/src/driver-types.ts:60

#### Returns

`void`

***

### get()

```ts
get<T>(...params): T | undefined;
```

Defined in: packages/store-sqlite/src/driver-types.ts:53

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

`T` \| `undefined`

***

### iterate()

```ts
iterate<T>(...params): IterableIterator<T>;
```

Defined in: packages/store-sqlite/src/driver-types.ts:55

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

`IterableIterator`\<`T`\>

***

### pluck()

```ts
pluck(toggle?): this;
```

Defined in: packages/store-sqlite/src/driver-types.ts:56

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toggle?` | `boolean` |

#### Returns

`this`

***

### raw()

```ts
raw(toggle?): this;
```

Defined in: packages/store-sqlite/src/driver-types.ts:57

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toggle?` | `boolean` |

#### Returns

`this`

***

### run()

```ts
run(...params): {
  changes: number;
  lastInsertRowid: number | bigint;
};
```

Defined in: packages/store-sqlite/src/driver-types.ts:52

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

```ts
{
  changes: number;
  lastInsertRowid: number | bigint;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `changes` | `number` | packages/store-sqlite/src/driver-types.ts:52 |
| `lastInsertRowid` | `number` \| `bigint` | packages/store-sqlite/src/driver-types.ts:52 |
