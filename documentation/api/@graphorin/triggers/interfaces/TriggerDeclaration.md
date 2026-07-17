[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / TriggerDeclaration

# Interface: TriggerDeclaration

Defined in: [packages/triggers/src/index.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L131)

Public trigger declaration emitted by the helper functions
(`cron(...)`, `interval(...)`, `idle(...)`, `event(...)`).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback` | `readonly` | [`TriggerCallback`](/api/@graphorin/triggers/type-aliases/TriggerCallback.md) | [packages/triggers/src/index.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L135) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/triggers/src/index.ts:132](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L132) |
| <a id="property-kind"></a> `kind` | `readonly` | [`TriggerKind`](/api/@graphorin/triggers/type-aliases/TriggerKind.md) | [packages/triggers/src/index.ts:133](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L133) |
| <a id="property-options"></a> `options` | `readonly` | [`TriggerOptions`](/api/@graphorin/triggers/interfaces/TriggerOptions.md) | [packages/triggers/src/index.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L136) |
| <a id="property-spec"></a> `spec` | `readonly` | `string` | [packages/triggers/src/index.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L134) |
