[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PairedPeerRecord

# Interface: PairedPeerRecord

Defined in: [packages/core/src/contracts/pairing-store.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L39)

A durably paired peer.

## Stable

## Extends

- [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`accountId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-accountid) | [packages/core/src/contracts/pairing-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L16) |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`channelId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-channelid) | [packages/core/src/contracts/pairing-store.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L15) |
| <a id="property-pairedat"></a> `pairedAt` | `readonly` | `string` | ISO-8601 pairing timestamp. | - | [packages/core/src/contracts/pairing-store.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L41) |
| <a id="property-peerid"></a> `peerId` | `readonly` | `string` | - | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md).[`peerId`](/api/@graphorin/core/interfaces/PairingPeerRef.md#property-peerid) | [packages/core/src/contracts/pairing-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L17) |
