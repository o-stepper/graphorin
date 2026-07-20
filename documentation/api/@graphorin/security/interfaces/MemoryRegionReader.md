[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryRegionReader

# Interface: MemoryRegionReader

Defined in: packages/security/src/guard/types.ts:73

**`Stable`**

Pluggable region reader. The host (the agent runtime, in Phase 12)
supplies a region reader that knows how to materialise a region as
raw bytes / a string for hashing.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-read"></a> `read` | `readonly` | (`region`) => `Promise`\<`string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt;\> | Materialise the named region as bytes. | packages/security/src/guard/types.ts:77 |
| <a id="property-regions"></a> `regions` | `readonly` | readonly `string`[] | Stable list of region names the guard should snapshot. | packages/security/src/guard/types.ts:75 |
