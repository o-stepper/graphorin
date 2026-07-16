[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ExecuteBatchOptions

# Interface: ExecuteBatchOptions

Defined in: [packages/tools/src/executor/types.ts:294](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L294)

Per-batch options accepted by `executor.executeBatch(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-calls"></a> `calls` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | - | [packages/tools/src/executor/types.ts:295](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L295) |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Run-level capability restriction (D2 - single-writer constraint). `'read-only'` deterministically blocks every `side-effecting` / `external-stateful` tool with a `capability_blocked` outcome, no matter what the model asked for - the enforcement half of the agent-side advertise filter. Absent ⇒ all capabilities (legacy). | [packages/tools/src/executor/types.ts:324](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L324) |
| <a id="property-disablerepair"></a> `disableRepair?` | `readonly` | `boolean` | Disable the single-round repair hook for this batch (tools-02). Used for PRE-APPROVED calls replayed on a durable-HITL resume: a human granted exactly these args, so a repair rewrite must fail as `invalid_input` rather than execute a payload nobody saw. | [packages/tools/src/executor/types.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L306) |
| <a id="property-preapproved"></a> `preApproved?` | `readonly` | `boolean` | E1: this batch replays calls a human ALREADY granted through the agent's durable-HITL pre-screen. `ask`/`defer` verdicts from the permission hook / argument policy are treated as satisfied (the grant IS their resolution) instead of failing closed; `deny` still blocks, and a hook rewrite of the granted args fails the call (tools-02). Set together with `disableRepair` by the agent's resume dispatch. | [packages/tools/src/executor/types.ts:316](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L316) |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | [packages/tools/src/executor/types.ts:296](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L296) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/tools/src/executor/types.ts:297](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L297) |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md) | Trust level for the per-tool sandbox resolution. Default `'user-defined'`. | [packages/tools/src/executor/types.ts:299](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L299) |
