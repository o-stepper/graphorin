[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / WalCheckpointManager

# Class: WalCheckpointManager

Defined in: packages/store-sqlite/src/connection.ts:323

Periodic `wal_checkpoint(RESTART)` runner. Invoked by the worker
pool every `intervalMs` to bound WAL growth on long-running servers.

## Stable

## Constructors

### Constructor

```ts
new WalCheckpointManager(conn, intervalMs): WalCheckpointManager;
```

Defined in: packages/store-sqlite/src/connection.ts:328

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `intervalMs` | `number` |

#### Returns

`WalCheckpointManager`

## Methods

### start()

```ts
start(): void;
```

Defined in: packages/store-sqlite/src/connection.ts:333

#### Returns

`void`

***

### stop()

```ts
stop(): void;
```

Defined in: packages/store-sqlite/src/connection.ts:346

#### Returns

`void`
