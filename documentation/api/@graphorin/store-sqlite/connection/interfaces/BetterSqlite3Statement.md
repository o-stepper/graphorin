[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / BetterSqlite3Statement

# Interface: BetterSqlite3Statement

Defined in: [packages/store-sqlite/src/driver-types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L51)

**`Internal`**

Subset of the `better-sqlite3` prepared-statement surface used by
the store.

## Methods

### all()

```ts
all<T>(...params): T[];
```

Defined in: [packages/store-sqlite/src/driver-types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L54)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L59)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L58)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L60)

#### Returns

`void`

***

### get()

```ts
get<T>(...params): T | undefined;
```

Defined in: [packages/store-sqlite/src/driver-types.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L53)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L55)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L56)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L57)

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

Defined in: [packages/store-sqlite/src/driver-types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L52)

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
| `changes` | `number` | [packages/store-sqlite/src/driver-types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L52) |
| `lastInsertRowid` | `number` \| `bigint` | [packages/store-sqlite/src/driver-types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/driver-types.ts#L52) |
