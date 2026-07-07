[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteFooterRecord

# Interface: ToolCassetteFooterRecord

Defined in: [packages/sessions/src/cassette/types.ts:180](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L180)

Sentinel footer (always last line).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checksum"></a> `checksum?` | `readonly` | `string` | [packages/sessions/src/cassette/types.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L184) |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `"aes256gcm"` \| `"chacha20-poly1305"` | [packages/sessions/src/cassette/types.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L186) |
| <a id="property-kind"></a> `kind` | `readonly` | `"footer"` | [packages/sessions/src/cassette/types.ts:181](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L181) |
| <a id="property-recordcount"></a> `recordCount` | `readonly` | `number` | [packages/sessions/src/cassette/types.ts:182](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L182) |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | [packages/sessions/src/cassette/types.ts:183](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L183) |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | [packages/sessions/src/cassette/types.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L185) |
