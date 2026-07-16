[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ResumeDirective

# Interface: ResumeDirective

Defined in: [packages/agent/src/types.ts:542](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L542)

Resume directive accepted by `agent.run(input | RunState, { directive })`.

The library-mode pickup pattern is: the operator stores the
suspended `RunState` from the previous `agent.run(...)` call,
waits for the user / cron / webhook to resolve the pending
approval, and re-invokes `agent.run(savedState, { directive: {
approvals: [...] } })` to resume.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-approvals"></a> `approvals?` | `readonly` | readonly `ApprovalDecision`[] | [packages/agent/src/types.ts:543](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L543) |
