[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ScheduleRetentionOptions

# Interface: ScheduleRetentionOptions

Defined in: [packages/server/src/runtime/retention.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L106)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`RetentionConfig`](/api/@graphorin/server/interfaces/RetentionConfig.md) | - | [packages/server/src/runtime/retention.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L108) |
| <a id="property-log"></a> `log?` | `readonly` | [`RetentionLog`](/api/@graphorin/server/type-aliases/RetentionLog.md) | - | [packages/server/src/runtime/retention.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L110) |
| <a id="property-now"></a> `now` | `readonly` | () => `number` | - | [packages/server/src/runtime/retention.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L109) |
| <a id="property-prunespansimpl"></a> `pruneSpansImpl?` | `readonly` | (`conn`, `opts`) => `number` | **`Internal`** Test seam for the span sweep (the real one issues SQL against `store.connection`). | [packages/server/src/runtime/retention.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L117) |
| <a id="property-store"></a> `store` | `readonly` | [`RetentionStoreLike`](/api/@graphorin/server/interfaces/RetentionStoreLike.md) | - | [packages/server/src/runtime/retention.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L107) |
