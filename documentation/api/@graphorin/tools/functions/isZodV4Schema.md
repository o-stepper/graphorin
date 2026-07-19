[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / isZodV4Schema

# Function: isZodV4Schema()

```ts
function isZodV4Schema(value): value is ZodV4Like;
```

Defined in: packages/tools/src/schema/to-json-schema.ts:76

`true` when `value` is a Zod **v4** schema instance. v4 instances carry a
versioned `_zod` internals bag (they also carry `_def`, so this check
must run before the v3 one).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`value is ZodV4Like`
