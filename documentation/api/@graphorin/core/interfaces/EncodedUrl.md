[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EncodedUrl

# Interface: EncodedUrl

Defined in: [packages/core/src/utils/binary-json.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L52)

URL reference as it appears on the wire (`URL` instances do not
survive `JSON.stringify` as instances - they serialize to their
`href` string).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-enc"></a> `enc` | `readonly` | `"url"` | [packages/core/src/utils/binary-json.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L53) |
| <a id="property-href"></a> `href` | `readonly` | `string` | [packages/core/src/utils/binary-json.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L54) |
