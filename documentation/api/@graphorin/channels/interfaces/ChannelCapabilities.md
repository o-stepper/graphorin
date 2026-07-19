[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelCapabilities

# Interface: ChannelCapabilities

Defined in: packages/channels/src/spi.ts:46

**`Stable`**

Static feature flags an adapter advertises so the gateway and the
application can shape output without vendor-specific branching.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-edit"></a> `edit` | `readonly` | `boolean` | The channel can edit an already-delivered message in place. | packages/channels/src/spi.ts:48 |
| <a id="property-maxtextlength"></a> `maxTextLength` | `readonly` | `number` | Hard per-message text length limit, in UTF-16 code units. | packages/channels/src/spi.ts:54 |
| <a id="property-typing"></a> `typing` | `readonly` | `boolean` | The channel supports a typing / progress indicator. | packages/channels/src/spi.ts:50 |
| <a id="property-voice"></a> `voice` | `readonly` | `boolean` | The channel can carry voice notes (see the `SttAdapter` contract in `@graphorin/core/contracts`). | packages/channels/src/spi.ts:52 |
