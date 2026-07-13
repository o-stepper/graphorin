[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / looksLikeJsonSchema

# Function: looksLikeJsonSchema()

```ts
function looksLikeJsonSchema(value): value is JsonSchemaRecord;
```

Defined in: [packages/tools/src/schema/to-json-schema.ts:777](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/schema/to-json-schema.ts#L777)

`true` when `value` is plain JSON-Schema-shaped data: an object with no
validator methods that either is empty or carries at least one JSON
Schema keyword.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`value is JsonSchemaRecord`
