[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ProductionStartupHookOptions

# Interface: ProductionStartupHookOptions

Defined in: [packages/provider/src/middleware/production-hook.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/production-hook.ts#L20)

Options for [assertProductionMiddleware](/api/@graphorin/provider/functions/assertProductionMiddleware.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-force"></a> `force?` | `readonly` | `boolean` | Force the check regardless of `NODE_ENV`. | [packages/provider/src/middleware/production-hook.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/production-hook.ts#L24) |
| <a id="property-requiredkinds"></a> `requiredKinds?` | `readonly` | readonly `string`[] | Middleware kinds that must be present. Defaults to `['withRedaction']`. | [packages/provider/src/middleware/production-hook.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/production-hook.ts#L22) |
