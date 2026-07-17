[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SuspendedRunPersistenceOptions

# Interface: SuspendedRunPersistenceOptions

Defined in: [packages/server/src/runtime/suspended-run-persistence.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/suspended-run-persistence.ts#L44)

Options for [createSuspendedRunPersistence](/api/@graphorin/server/functions/createSuspendedRunPersistence.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | - | [packages/server/src/runtime/suspended-run-persistence.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/suspended-run-persistence.ts#L45) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | [packages/server/src/runtime/suspended-run-persistence.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/suspended-run-persistence.ts#L47) |
| <a id="property-store"></a> `store` | `readonly` | [`SuspendedRunPersistenceStore`](/api/@graphorin/server/interfaces/SuspendedRunPersistenceStore.md) | - | [packages/server/src/runtime/suspended-run-persistence.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/suspended-run-persistence.ts#L46) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | WARN sink. Default `console.warn`. | [packages/server/src/runtime/suspended-run-persistence.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/suspended-run-persistence.ts#L49) |
