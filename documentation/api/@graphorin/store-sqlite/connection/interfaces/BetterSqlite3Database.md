[**Graphorin API reference v0.13.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / BetterSqlite3Database

# Interface: BetterSqlite3Database

Defined in: packages/store-sqlite/src/driver-types.ts:21

**`Internal`**

Subset of the `better-sqlite3` `Database` surface used by the store.
Declared structurally so the package can defer the peer dependency
load to runtime and keep the module load free of side effects.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-intransaction"></a> `inTransaction` | `readonly` | `boolean` | packages/store-sqlite/src/driver-types.ts:42 |
| <a id="property-open"></a> `open` | `readonly` | `boolean` | packages/store-sqlite/src/driver-types.ts:41 |

## Methods

### backup()

```ts
backup(destinationPath): Promise<unknown>;
```

Defined in: packages/store-sqlite/src/driver-types.ts:38

Online page-level backup (store-02/05). Consistent under a live
writer and preserves rowids (so FTS5 external-content mappings
survive - unlike `VACUUM INTO`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `destinationPath` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### close()

```ts
close(): void;
```

Defined in: packages/store-sqlite/src/driver-types.ts:39

#### Returns

`void`

***

### exec()

```ts
exec(query): void;
```

Defined in: packages/store-sqlite/src/driver-types.ts:23

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

Defined in: packages/store-sqlite/src/driver-types.ts:40

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

Defined in: packages/store-sqlite/src/driver-types.ts:22

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

Defined in: packages/store-sqlite/src/driver-types.ts:24

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

[`BetterSqlite3Statement`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Statement.md)

***

### transaction()

```ts
transaction<T>(fn): T & {
  deferred: T;
  exclusive: T;
  immediate: T;
};
```

Defined in: packages/store-sqlite/src/driver-types.ts:30

The returned wrapper also carries the `.deferred` / `.immediate` /
`.exclusive` variants (store-06 uses `.immediate` for every write
transaction).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* (...`args`) => `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | `T` |

#### Returns

`T` & \{
  `deferred`: `T`;
  `exclusive`: `T`;
  `immediate`: `T`;
\}
