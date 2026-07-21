[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / zodToJsonSchema

# Function: zodToJsonSchema()

```ts
function zodToJsonSchema(schema, opts?): JsonSchemaRecord;
```

Defined in: packages/tools/src/schema/to-json-schema.ts:739

**`Stable`**

Convert a Zod schema instance (v3 classic or v4) to a JSON Schema
record. Structural: works across `zod` copies and never executes user
validation code (only `default` factories and `lazy` getters, both
guarded). Unknown node kinds degrade to permissive `{}` and are
reported via `onUnsupported`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `schema` | `unknown` |
| `opts` | [`ProjectSchemaOptions`](/api/@graphorin/tools/interfaces/ProjectSchemaOptions.md) |

## Returns

[`JsonSchemaRecord`](/api/@graphorin/tools/type-aliases/JsonSchemaRecord.md)
