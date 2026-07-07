[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / WalCheckpointManager

# Class: WalCheckpointManager

Defined in: [packages/store-sqlite/src/connection.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L365)

Periodic `wal_checkpoint(RESTART)` runner. Invoked by the worker
pool every `intervalMs` to bound WAL growth on long-running servers.

## Stable

## Constructors

### Constructor

```ts
new WalCheckpointManager(conn, intervalMs): WalCheckpointManager;
```

Defined in: [packages/store-sqlite/src/connection.ts:370](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L370)

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

Defined in: [packages/store-sqlite/src/connection.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L375)

#### Returns

`void`

***

### stop()

```ts
stop(): void;
```

Defined in: [packages/store-sqlite/src/connection.ts:388](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L388)

#### Returns

`void`
