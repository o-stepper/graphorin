[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / freshRegex

# Function: freshRegex()

```ts
function freshRegex(re): RegExp;
```

Defined in: packages/tools/src/outbound/commentary-patterns.ts:145

**`Stable`**

Clone a regex before every scan. RegExp instances with the `g`
flag carry a mutable `lastIndex`; cloning keeps sanitizers built
over the shared catalogue stateless.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `re` | `RegExp` |

## Returns

`RegExp`
