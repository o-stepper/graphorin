[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / TriggerDeclaration

# Interface: TriggerDeclaration

Defined in: [packages/triggers/src/index.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L90)

Public trigger declaration emitted by the helper functions
(`cron(...)`, `interval(...)`, `idle(...)`, `event(...)`).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback` | `readonly` | [`TriggerCallback`](/api/@graphorin/triggers/type-aliases/TriggerCallback.md) | [packages/triggers/src/index.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L94) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/triggers/src/index.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L91) |
| <a id="property-kind"></a> `kind` | `readonly` | [`TriggerKind`](/api/@graphorin/triggers/type-aliases/TriggerKind.md) | [packages/triggers/src/index.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L92) |
| <a id="property-options"></a> `options` | `readonly` | [`TriggerOptions`](/api/@graphorin/triggers/interfaces/TriggerOptions.md) | [packages/triggers/src/index.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L95) |
| <a id="property-spec"></a> `spec` | `readonly` | `string` | [packages/triggers/src/index.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L93) |
