[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / BetterSqlite3Statement

# Interface: BetterSqlite3Statement

Defined in: packages/store-sqlite/src/connection.ts:29

**`Internal`**

Subset of the `better-sqlite3` prepared-statement surface used by
the store.

## Methods

### all()

```ts
all<T>(...params): T[];
```

Defined in: packages/store-sqlite/src/connection.ts:32

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

Defined in: packages/store-sqlite/src/connection.ts:37

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

Defined in: packages/store-sqlite/src/connection.ts:36

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

Defined in: packages/store-sqlite/src/connection.ts:38

#### Returns

`void`

***

### get()

```ts
get<T>(...params): T | undefined;
```

Defined in: packages/store-sqlite/src/connection.ts:31

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

Defined in: packages/store-sqlite/src/connection.ts:33

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | readonly `unknown`[] |

#### Returns

`IterableIterator`\&lt;`T`\&gt;

***

### pluck()

```ts
pluck(toggle?): this;
```

Defined in: packages/store-sqlite/src/connection.ts:34

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

Defined in: packages/store-sqlite/src/connection.ts:35

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

Defined in: packages/store-sqlite/src/connection.ts:30

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
| `changes` | `number` | packages/store-sqlite/src/connection.ts:30 |
| `lastInsertRowid` | `number` \| `bigint` | packages/store-sqlite/src/connection.ts:30 |
