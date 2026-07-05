[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / PendingPauseRecord

# Interface: PendingPauseRecord

Defined in: packages/workflow/src/types.ts:376

Structured record stored alongside a suspended checkpoint so the
engine can resume the paused node with the operator's directive.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dispatchargs"></a> `dispatchArgs?` | `readonly` | `unknown` | Args supplied to [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md) when the paused task was scheduled. | packages/workflow/src/types.ts:380 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Awakeable / approval name (D1) - present when the suspension came from `awaitExternal(name)` or `requestApproval(name)`. Targeted by `workflow.resolveAwakeable(...)` / `workflow.approve(...)`. | packages/workflow/src/types.ts:403 |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | - | packages/workflow/src/types.ts:377 |
| <a id="property-satisfied"></a> `satisfied?` | `readonly` | readonly `unknown`[] | Ordered resume values ALREADY delivered to this node's earlier `pause()` calls (WF-2). On resume the body re-executes from the top: these replay by index, and the new directive value lands at the next cursor. | packages/workflow/src/types.ts:391 |
| <a id="property-staticafter"></a> `staticAfter?` | `readonly` | `boolean` | When `true` the engine paused after the task completed, via `pauseAt.after`. | packages/workflow/src/types.ts:384 |
| <a id="property-staticbefore"></a> `staticBefore?` | `readonly` | `boolean` | When `true` the task was paused statically by `pauseAt.before`. | packages/workflow/src/types.ts:382 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | packages/workflow/src/types.ts:378 |
| <a id="property-wakeat"></a> `wakeAt?` | `readonly` | `number` | Epoch ms at which a durable timer becomes due (D1) - present when the suspension came from `sleepUntil(...)` / `sleepFor(...)`. `workflow.tick(threadId)` resumes the thread once due. | packages/workflow/src/types.ts:397 |
