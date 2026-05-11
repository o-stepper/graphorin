[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / BetterSqlite3Database

# Interface: BetterSqlite3Database

Defined in: packages/store-sqlite/src/connection.ts:12

**`Internal`**

Subset of the `better-sqlite3` `Database` surface used by the store.
Declared structurally so the package can defer the peer dependency
load to runtime and keep the module load free of side effects.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-intransaction"></a> `inTransaction` | `readonly` | `boolean` | packages/store-sqlite/src/connection.ts:20 |
| <a id="property-open"></a> `open` | `readonly` | `boolean` | packages/store-sqlite/src/connection.ts:19 |

## Methods

### close()

```ts
close(): void;
```

Defined in: packages/store-sqlite/src/connection.ts:17

#### Returns

`void`

***

### exec()

```ts
exec(query): void;
```

Defined in: packages/store-sqlite/src/connection.ts:14

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`void`

***

### loadExtension()

```ts
loadExtension(path): void;
```

Defined in: packages/store-sqlite/src/connection.ts:18

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`void`

***

### pragma()

```ts
pragma(query, options?): unknown;
```

Defined in: packages/store-sqlite/src/connection.ts:13

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

Defined in: packages/store-sqlite/src/connection.ts:15

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

[`BetterSqlite3Statement`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Statement.md)

***

### transaction()

```ts
transaction<T>(fn): T;
```

Defined in: packages/store-sqlite/src/connection.ts:16

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* (...`args`) => `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | `T` |

#### Returns

`T`
