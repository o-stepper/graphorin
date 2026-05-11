[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PauseResumeScope

# Interface: PauseResumeScope

Defined in: packages/core/src/channels/pause.ts:46

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

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consumed"></a> `consumed` | `public` | `boolean` | packages/core/src/channels/pause.ts:48 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | packages/core/src/channels/pause.ts:47 |
