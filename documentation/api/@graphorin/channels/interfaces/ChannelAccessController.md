[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAccessController

# Interface: ChannelAccessController

Defined in: packages/channels/src/access.ts:107

**`Stable`**

The access controller consumed by the gateway. `approve` and
`revoke` are the operator surface (CLI / REST wiring is
application-side).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-policy"></a> `policy` | `readonly` | [`ChannelAccessPolicyKind`](/api/@graphorin/channels/type-aliases/ChannelAccessPolicyKind.md) | packages/channels/src/access.ts:108 |

## Methods

### approve()

```ts
approve(channelId, code): Promise<
  | PairedPeerRecord
| null>;
```

Defined in: packages/channels/src/access.ts:116

Operator approval of a pairing code. One-time: consumes the
request and durably pairs the peer. Returns `null` when the code
is unknown or expired (an expired code is also deleted).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId` | `string` |
| `code` | `string` |

#### Returns

`Promise`\<
  \| [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md)
  \| `null`\>

***

### check()

```ts
check(identity): Promise<ChannelAccessDecision>;
```

Defined in: packages/channels/src/access.ts:110

Evaluate one inbound identity. Deterministic given store state + clock.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `identity` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) |

#### Returns

`Promise`\&lt;[`ChannelAccessDecision`](/api/@graphorin/channels/type-aliases/ChannelAccessDecision.md)\&gt;

***

### listPaired()

```ts
listPaired(channelId?): Promise<readonly PairedPeerRecord[]>;
```

Defined in: packages/channels/src/access.ts:120

List durably paired peers (operator surface).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelId?` | `string` |

#### Returns

`Promise`\&lt;readonly [`PairedPeerRecord`](/api/@graphorin/core/interfaces/PairedPeerRecord.md)[]\&gt;

***

### revoke()

```ts
revoke(peer): Promise<void>;
```

Defined in: packages/channels/src/access.ts:118

Remove a durably paired peer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `peer` | [`PairingPeerRef`](/api/@graphorin/core/interfaces/PairingPeerRef.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
