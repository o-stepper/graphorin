[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqlitePairingStore

# Class: SqlitePairingStore

Defined in: [packages/store-sqlite/src/pairing-store.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L52)

Default `PairingStore` implementation (migration 034). Expiry
policy lives in the access controller of `@graphorin/channels`;
this store only filters by the timestamps it is handed.

## Stable

## Implements

- [`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md)

## Constructors

### Constructor

```ts
new SqlitePairingStore(conn): SqlitePairingStore;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L54)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqlitePairingStore`

## Methods

### addPairedPeer()

```ts
addPairedPeer(peer): Promise<void>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L117)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`addPairedPeer`](/api/@graphorin/core/interfaces/PairingStore.md#addpairedpeer)

***

### countPendingRequests()

```ts
countPendingRequests(channelId, nowIso): Promise<number>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L98)

Count pending requests on a channel whose `expiresAt` is after `nowIso`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `nowIso` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`countPendingRequests`](/api/@graphorin/core/interfaces/PairingStore.md#countpendingrequests)

***

### deleteRequest()

```ts
deleteRequest(channelId, code): Promise<void>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L91)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `code` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`deleteRequest`](/api/@graphorin/core/interfaces/PairingStore.md#deleterequest)

***

### findRequestByCode()

```ts
findRequestByCode(channelId, code): Promise<
  | PairingRequestRecord
| null>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L83)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `code` | `string` |

#### Returns

`Promise`\<
  \| [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md)
  \| `null`\>

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`findRequestByCode`](/api/@graphorin/core/interfaces/PairingStore.md#findrequestbycode)

***

### findRequestByPeer()

```ts
findRequestByPeer(peer): Promise<
  | PairingRequestRecord
| null>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L74)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\<
  \| [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md)
  \| `null`\>

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`findRequestByPeer`](/api/@graphorin/core/interfaces/PairingStore.md#findrequestbypeer)

***

### isPaired()

```ts
isPaired(peer): Promise<boolean>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L126)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\&lt;`boolean`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`isPaired`](/api/@graphorin/core/interfaces/PairingStore.md#ispaired)

***

### listPairedPeers()

```ts
listPairedPeers(channelId?): Promise<readonly PairedPeerRecord[]>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L143)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId?` | `string` |

#### Returns

`Promise`\&lt;readonly [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md)[]\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`listPairedPeers`](/api/@graphorin/core/interfaces/PairingStore.md#listpairedpeers)

***

### pruneExpiredRequests()

```ts
pruneExpiredRequests(nowIso): Promise<number>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L106)

Delete requests whose `expiresAt` is at or before `nowIso`; returns the number removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nowIso` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`pruneExpiredRequests`](/api/@graphorin/core/interfaces/PairingStore.md#pruneexpiredrequests)

***

### removePairedPeer()

```ts
removePairedPeer(peer): Promise<void>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L135)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`removePairedPeer`](/api/@graphorin/core/interfaces/PairingStore.md#removepairedpeer)

***

### upsertRequest()

```ts
upsertRequest(request): Promise<void>;
```

Defined in: [packages/store-sqlite/src/pairing-store.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/pairing-store.ts#L58)

Insert or replace the (single) pending request for the peer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md).[`upsertRequest`](/api/@graphorin/core/interfaces/PairingStore.md#upsertrequest)
