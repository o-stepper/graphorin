[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / LoggerOptions

# Interface: LoggerOptions

Defined in: [packages/observability/src/logger/logger.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L33)

Configuration shape for [createLogger](/api/@graphorin/observability/functions/createLogger.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaulttier"></a> `defaultTier?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default sensitivity tier for fields. Defaults to `'internal'`. | [packages/observability/src/logger/logger.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L39) |
| <a id="property-format"></a> `format?` | `readonly` | [`LoggerFormat`](/api/@graphorin/observability/type-aliases/LoggerFormat.md) | - | [packages/observability/src/logger/logger.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L35) |
| <a id="property-level"></a> `level?` | `readonly` | [`LogLevel`](/api/@graphorin/core/type-aliases/LogLevel.md) | - | [packages/observability/src/logger/logger.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L34) |
| <a id="property-redaction"></a> `redaction?` | `readonly` | [`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) | Optional validator. Logger fields flow through `validate(...)`. | [packages/observability/src/logger/logger.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L37) |
| <a id="property-sink"></a> `sink?` | `readonly` | (`level`, `line`) => `void` | Sink that receives the rendered line. Defaults to writing to the appropriate `console.*` method. | [packages/observability/src/logger/logger.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/logger/logger.ts#L44) |
