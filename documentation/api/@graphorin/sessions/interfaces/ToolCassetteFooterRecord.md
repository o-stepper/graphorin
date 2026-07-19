[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteFooterRecord

# Interface: ToolCassetteFooterRecord

Defined in: packages/sessions/src/cassette/types.ts:180

**`Stable`**

Sentinel footer (always last line).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checksum"></a> `checksum?` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:184 |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `"aes256gcm"` \| `"chacha20-poly1305"` | packages/sessions/src/cassette/types.ts:186 |
| <a id="property-kind"></a> `kind` | `readonly` | `"footer"` | packages/sessions/src/cassette/types.ts:181 |
| <a id="property-recordcount"></a> `recordCount` | `readonly` | `number` | packages/sessions/src/cassette/types.ts:182 |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | packages/sessions/src/cassette/types.ts:183 |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:185 |
