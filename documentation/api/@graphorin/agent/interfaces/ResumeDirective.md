[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ResumeDirective

# Interface: ResumeDirective

Defined in: packages/agent/src/types.ts:549

**`Stable`**

Resume directive accepted by `agent.run(input | RunState, { directive })`.

The library-mode pickup pattern is: the operator stores the
suspended `RunState` from the previous `agent.run(...)` call,
waits for the user / cron / webhook to resolve the pending
approval, and re-invokes `agent.run(savedState, { directive: {
approvals: [...] } })` to resume.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-approvals"></a> `approvals?` | `readonly` | readonly `ApprovalDecision`[] | packages/agent/src/types.ts:550 |
