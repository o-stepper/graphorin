[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / validate

# Function: validate()

```ts
function validate<T>(schema, data): ValidationResult<T>;
```

Defined in: packages/core/src/utils/validation.ts:60

Synchronous validation wrapper. Does **not** swallow errors thrown by
the schema's transformations - only normalizes the success / failure
signal.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `schema` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\<`T`\> |
| `data` | `unknown` |

## Returns

[`ValidationResult`](/api/@graphorin/core/type-aliases/ValidationResult.md)\<`T`\>

## Stable
