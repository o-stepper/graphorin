[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / looksLikeJsonSchema

# Function: looksLikeJsonSchema()

```ts
function looksLikeJsonSchema(value): value is JsonSchemaRecord;
```

Defined in: packages/tools/src/schema/to-json-schema.ts:777

`true` when `value` is plain JSON-Schema-shaped data: an object with no
validator methods that either is empty or carries at least one JSON
Schema keyword.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`value is JsonSchemaRecord`
