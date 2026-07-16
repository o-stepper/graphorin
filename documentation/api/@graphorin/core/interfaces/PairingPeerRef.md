[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PairingPeerRef

# Interface: PairingPeerRef

Defined in: [packages/core/src/contracts/pairing-store.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L14)

Channel pairing persistence. Backs the default `'pairing'` access
policy of the channel gateway (`@graphorin/channels`): an unknown
peer's first contact creates a short-lived pairing request; the
operator approves the code out-of-band; the peer becomes durable
paired. Default impl lives in `@graphorin/store-sqlite`.

The peer reference triple mirrors `ChannelIdentity` from
`@graphorin/channels` structurally (core takes no dependency on
the channels package).

## Stable

## Extended by

- [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md)
- [`PairingRequestRecord`](/api/@graphorin/core/interfaces/PairingRequestRecord.md)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId` | `readonly` | `string` | [packages/core/src/contracts/pairing-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L16) |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | [packages/core/src/contracts/pairing-store.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L15) |
| <a id="property-peerid"></a> `peerId` | `readonly` | `string` | [packages/core/src/contracts/pairing-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/pairing-store.ts#L17) |
