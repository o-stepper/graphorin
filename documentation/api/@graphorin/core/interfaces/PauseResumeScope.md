[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PauseResumeScope

# Interface: PauseResumeScope

Defined in: packages/core/src/channels/pause.ts:128

**`Internal`**

Resume-injection scope set by the workflow runtime around the second
(and later) invocations of a paused node body. When the scope is
present, `pause(...)` consults it to decide whether to throw a fresh
[PauseSignal](/api/@graphorin/core/classes/PauseSignal.md) or return the injected value the runtime supplied
via `Workflow.resume(threadId, new Directive({ resume }))`.

This is the storage mechanism that gives `pause()` its symmetric
pair semantics (`pause` ↔ `resume`) without forcing every node body
to be re-architected as a state machine.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor` | `public` | `number` | - | packages/core/src/channels/pause.ts:136 |
| <a id="property-meta"></a> `meta?` | `readonly` | readonly ( \| [`PauseIdentity`](/api/@graphorin/core/interfaces/PauseIdentity.md) \| `null` \| `undefined`)[] | Per-value identity of the pause each value answered. Absent (legacy checkpoints) or `null`/empty entries skip the check. | packages/core/src/channels/pause.ts:135 |
| <a id="property-values"></a> `values` | `readonly` | readonly `unknown`[] | Ordered resume values replayed to successive `pause()` calls. | packages/core/src/channels/pause.ts:130 |
