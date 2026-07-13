[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ProjectSchemaOptions

# Interface: ProjectSchemaOptions

Defined in: [packages/tools/src/schema/to-json-schema.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/schema/to-json-schema.ts#L39)

Options for [projectSchemaToJsonSchema](/api/@graphorin/tools/functions/projectSchemaToJsonSchema.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onunsupported"></a> `onUnsupported?` | `readonly` | (`detail`) => `void` | Called (at most once per distinct reason per call) when a schema node cannot be represented and degrades to permissive `{}` - or when a validator-like object cannot be projected at all. Wire this to a counter/audit emitter; the converter itself never logs. | [packages/tools/src/schema/to-json-schema.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/schema/to-json-schema.ts#L46) |
