[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PairingStore

# Interface: PairingStore

Defined in: packages/core/src/contracts/pairing-store.ts:52

**`Stable`**

Pluggable persistent storage for channel pairing. Expiry POLICY
lives in the access controller (`@graphorin/channels`), which
injects its clock; the store only filters by the timestamps it is
handed so behavior stays deterministic under test.

## Methods

### addPairedPeer()

```ts
addPairedPeer(peer): Promise<void>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:62

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### countPendingRequests()

```ts
countPendingRequests(channelId, nowIso): Promise<number>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:59

Count pending requests on a channel whose `expiresAt` is after `nowIso`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `nowIso` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### deleteRequest()

```ts
deleteRequest(channelId, code): Promise<void>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:57

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `code` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### findRequestByCode()

```ts
findRequestByCode(channelId, code): Promise<
  | PairingRequestRecord
| null>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:56

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `code` | `string` |

#### Returns

`Promise`\<
  \| [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md)
  \| `null`\>

***

### findRequestByPeer()

```ts
findRequestByPeer(peer): Promise<
  | PairingRequestRecord
| null>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:55

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\<
  \| [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md)
  \| `null`\>

***

### isPaired()

```ts
isPaired(peer): Promise<boolean>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:63

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\&lt;`boolean`\&gt;

***

### listPairedPeers()

```ts
listPairedPeers(channelId?): Promise<readonly PairedPeerRecord[]>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:65

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId?` | `string` |

#### Returns

`Promise`\&lt;readonly [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md)[]\&gt;

***

### pruneExpiredRequests()

```ts
pruneExpiredRequests(nowIso): Promise<number>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:61

Delete requests whose `expiresAt` is at or before `nowIso`; returns the number removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nowIso` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### removePairedPeer()

```ts
removePairedPeer(peer): Promise<void>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:64

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### upsertRequest()

```ts
upsertRequest(request): Promise<void>;
```

Defined in: packages/core/src/contracts/pairing-store.ts:54

Insert or replace the (single) pending request for the peer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
