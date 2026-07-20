[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / TiktokenEncoding

# Interface: TiktokenEncoding

Defined in: packages/provider/src/counters/js-tiktoken.ts:26

**`Stable`**

Structural view of a `js-tiktoken` encoding instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name?` | `readonly` | `string` | packages/provider/src/counters/js-tiktoken.ts:27 |

## Methods

### encode()

```ts
encode(
   text, 
   allowedSpecial?, 
   disallowedSpecial?): {
  length: number;
};
```

Defined in: packages/provider/src/counters/js-tiktoken.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `allowedSpecial?` | readonly `string`[] \| `"all"` |
| `disallowedSpecial?` | readonly `string`[] \| `"all"` |

#### Returns

```ts
{
  length: number;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `length` | `number` | packages/provider/src/counters/js-tiktoken.ts:32 |
