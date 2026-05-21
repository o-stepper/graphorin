[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / SqliteConnection

# Interface: SqliteConnection

Defined in: packages/store-sqlite/src/connection.ts:24

The runtime contract every higher-level store interacts with. The
concrete adapter is built by [openConnection](/api/@graphorin/store-sqlite/connection/functions/openConnection.md) and wraps either
`better-sqlite3` (default) or `better-sqlite3-multiple-ciphers`
(encryption-at-rest opt-in).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-encrypted"></a> `encrypted` | `readonly` | `boolean` | Whether the connection is encryption-enabled. | packages/store-sqlite/src/connection.ts:28 |
| <a id="property-inmemory"></a> `inMemory` | `readonly` | `boolean` | Whether the connection wraps a `:memory:` database. | packages/store-sqlite/src/connection.ts:30 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Path to the underlying database file (`':memory:'` for in-memory). | packages/store-sqlite/src/connection.ts:26 |

## Methods

### all()

```ts
all<T>(query, params?): T[];
```

Defined in: packages/store-sqlite/src/connection.ts:36

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `params?` | readonly `unknown`[] |

#### Returns

`T`[]

***

### close()

```ts
close(): void;
```

Defined in: packages/store-sqlite/src/connection.ts:39

#### Returns

`void`

***

### exec()

```ts
exec(query): void;
```

Defined in: packages/store-sqlite/src/connection.ts:32

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`void`

***

### execMany()

```ts
execMany(sql): void;
```

Defined in: packages/store-sqlite/src/connection.ts:33

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sql` | `string` |

#### Returns

`void`

***

### get()

```ts
get<T>(query, params?): T | undefined;
```

Defined in: packages/store-sqlite/src/connection.ts:35

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `params?` | readonly `unknown`[] |

#### Returns

`T` \| `undefined`

***

### pragma()

```ts
pragma(query, options?): unknown;
```

Defined in: packages/store-sqlite/src/connection.ts:31

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `options?` | \{ `simple?`: `boolean`; \} |
| `options.simple?` | `boolean` |

#### Returns

`unknown`

***

### prepare()

```ts
prepare(query): BetterSqlite3Statement;
```

Defined in: packages/store-sqlite/src/connection.ts:37

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

[`BetterSqlite3Statement`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Statement.md)

***

### raw()

```ts
raw(): BetterSqlite3Database;
```

Defined in: packages/store-sqlite/src/connection.ts:41

Returns the underlying `better-sqlite3` handle. Escape hatch only.

#### Returns

[`BetterSqlite3Database`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Database.md)

***

### run()

```ts
run(query, params?): {
  changes: number;
};
```

Defined in: packages/store-sqlite/src/connection.ts:34

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `params?` | readonly `unknown`[] |

#### Returns

```ts
{
  changes: number;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `changes` | `number` | packages/store-sqlite/src/connection.ts:34 |

***

### transaction()

```ts
transaction<T>(fn): T;
```

Defined in: packages/store-sqlite/src/connection.ts:38

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | () => `T` |

#### Returns

`T`
