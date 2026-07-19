[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PairingRequestRecord

# Interface: PairingRequestRecord

Defined in: packages/core/src/contracts/pairing-store.ts:26

**`Stable`**

A pending pairing request. At most one per peer (upsert replaces);
codes are unique per channel and single-use.

## Extends

- [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`accountId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-accountid) | packages/core/src/contracts/pairing-store.ts:16 |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`channelId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-channelid) | packages/core/src/contracts/pairing-store.ts:15 |
| <a id="property-code"></a> `code` | `readonly` | `string` | - | - | packages/core/src/contracts/pairing-store.ts:27 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | ISO-8601 creation timestamp. | - | packages/core/src/contracts/pairing-store.ts:29 |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `string` | ISO-8601 expiry; expired requests are dead even if still stored. | - | packages/core/src/contracts/pairing-store.ts:31 |
| <a id="property-peerid"></a> `peerId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`peerId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-peerid) | packages/core/src/contracts/pairing-store.ts:17 |
