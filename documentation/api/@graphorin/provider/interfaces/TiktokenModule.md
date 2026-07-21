[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / TiktokenModule

# Interface: TiktokenModule

Defined in: packages/provider/src/counters/js-tiktoken.ts:53

**`Stable`**

Structural view of the `js-tiktoken` module accepted by
`JsTiktokenCounterOptions.moduleOverride`.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-encodingformodel"></a> `encodingForModel?` | (`model`) => [`TiktokenEncoding`](/api/@graphorin/provider/interfaces/TiktokenEncoding.md) | packages/provider/src/counters/js-tiktoken.ts:55 |

## Methods

### getEncoding()

```ts
getEncoding(name): TiktokenEncoding;
```

Defined in: packages/provider/src/counters/js-tiktoken.ts:54

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`TiktokenEncoding`](/api/@graphorin/provider/interfaces/TiktokenEncoding.md)
