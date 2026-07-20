[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EncodedUrl

# Interface: EncodedUrl

Defined in: packages/core/src/utils/binary-json.ts:52

**`Stable`**

URL reference as it appears on the wire (`URL` instances do not
survive `JSON.stringify` as instances - they serialize to their
`href` string).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-enc"></a> `enc` | `readonly` | `"url"` | packages/core/src/utils/binary-json.ts:53 |
| <a id="property-href"></a> `href` | `readonly` | `string` | packages/core/src/utils/binary-json.ts:54 |
