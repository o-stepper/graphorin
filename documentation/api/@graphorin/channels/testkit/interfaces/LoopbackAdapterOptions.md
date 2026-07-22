[**Graphorin API reference v0.13.13**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / LoopbackAdapterOptions

# Interface: LoopbackAdapterOptions

Defined in: packages/channels/src/testkit/loopback-adapter.ts:13

**`Stable`**

Options for [createLoopbackAdapter](/api/@graphorin/channels/testkit/functions/createLoopbackAdapter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId?` | `readonly` | `string` | Account id stamped on injected messages. Default `'bot'`. | packages/channels/src/testkit/loopback-adapter.ts:18 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ChannelCapabilities`](/api/@graphorin/channels/interfaces/ChannelCapabilities.md)\&gt; | - | packages/channels/src/testkit/loopback-adapter.ts:16 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Channel id. Default `'loopback'`. | packages/channels/src/testkit/loopback-adapter.ts:15 |
