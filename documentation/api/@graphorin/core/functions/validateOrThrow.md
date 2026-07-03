[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / validateOrThrow

# Function: validateOrThrow()

```ts
function validateOrThrow<T>(
   schema, 
   data, 
   what?): T;
```

Defined in: packages/core/src/utils/validation.ts:64

Throwing variant of `validate(...)` that surfaces a `TypeError` carrying
a stable, parser-style message. Useful at module-boundary entry points
where a thrown error is the natural failure mode.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `schema` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`T`\&gt; |
| `data` | `unknown` |
| `what?` | `string` |

## Returns

`T`

## Stable
