[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RegisterTriggersOptions

# Interface: RegisterTriggersOptions

Defined in: [packages/memory/src/consolidator/scheduler.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L78)

Options accepted by [registerConsolidatorTriggers](/api/@graphorin/memory/functions/registerConsolidatorTriggers.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acknowledgelibmode"></a> `acknowledgeLibMode?` | `readonly` | `boolean` | Suppress the per-process library-mode WARN. Defaults to `true`. | [packages/memory/src/consolidator/scheduler.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L93) |
| <a id="property-catchuppolicy"></a> `catchupPolicy?` | `readonly` | [`ConsolidatorCatchupPolicy`](/api/@graphorin/memory/type-aliases/ConsolidatorCatchupPolicy.md) | Catch-up policy applied to every registered trigger. Defaults to `'none'` per DEC-150 - safest for personal-assistant scenarios. | [packages/memory/src/consolidator/scheduler.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L91) |
| <a id="property-idprefix"></a> `idPrefix?` | `readonly` | `string` | Optional id prefix - useful when multiple scopes share a scheduler. | [packages/memory/src/consolidator/scheduler.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L95) |
| <a id="property-include"></a> `include?` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | Filter - only register the supplied subset of triggers. By default every parseable trigger declared on the consolidator is registered (turn / event triggers are skipped because the Scheduler has no way to fire them on its own). | [packages/memory/src/consolidator/scheduler.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L104) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | Scope passed to `consolidator.trigger(...)` for every fire. The consolidator only operates on a single user/session at a time (DEC-005 single-user-per-process); multi-tenant deployments register one scheduler-trigger pair per scope. | [packages/memory/src/consolidator/scheduler.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L85) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Optional tags forwarded to the scheduler. | [packages/memory/src/consolidator/scheduler.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L97) |
