[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAccessPolicyConfig

# Interface: ChannelAccessPolicyConfig

Defined in: packages/channels/src/access.ts:58

**`Stable`**

Access policy configuration. Data, not code: the application
supplies the kind plus its parameters.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowlist"></a> `allowlist?` | `readonly` | readonly [`ChannelAllowlistEntry`](/api/@graphorin/channels/interfaces/ChannelAllowlistEntry.md)[] | Required when `kind` is `'allowlist'`. | packages/channels/src/access.ts:61 |
| <a id="property-kind"></a> `kind` | `readonly` | [`ChannelAccessPolicyKind`](/api/@graphorin/channels/type-aliases/ChannelAccessPolicyKind.md) | - | packages/channels/src/access.ts:59 |
| <a id="property-pairing"></a> `pairing?` | `readonly` | [`PairingPolicyOptions`](/api/@graphorin/channels/interfaces/PairingPolicyOptions.md) | Tuning for `kind: 'pairing'`. | packages/channels/src/access.ts:63 |
