[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / projectSchemaToJsonSchema

# Function: projectSchemaToJsonSchema()

```ts
function projectSchemaToJsonSchema(raw, opts?): 
  | JsonSchemaRecord
  | undefined;
```

Defined in: packages/tools/src/schema/to-json-schema.ts:804

**`Stable`**

Project a tool's declared `inputSchema` / `outputSchema` - whatever the
author supplied - onto a JSON Schema record fit for a provider wire
body or a code-mode signature. Resolution order:

1. `undefined`/`null` → `undefined`.
2. A `toJSON()` method → its result (MCP validators, hand-rolled
   schemas; a throwing/non-object `toJSON` falls through).
3. A Zod v4 or v3 schema → [zodToJsonSchema](/api/@graphorin/tools/functions/zodToJsonSchema.md).
4. Plain JSON-Schema-shaped data → passed through as-is.
5. Anything else (an opaque validator this converter cannot read) →
   `undefined`, reported via `onUnsupported` - callers substitute a
   permissive `{}` rather than shipping serialized internals.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `unknown` |
| `opts` | [`ProjectSchemaOptions`](/api/@graphorin/tools/interfaces/ProjectSchemaOptions.md) |

## Returns

  \| [`JsonSchemaRecord`](/api/@graphorin/tools/type-aliases/JsonSchemaRecord.md)
  \| `undefined`
