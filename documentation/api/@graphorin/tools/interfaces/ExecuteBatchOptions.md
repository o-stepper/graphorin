[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ExecuteBatchOptions

# Interface: ExecuteBatchOptions

Defined in: packages/tools/src/executor/executor.ts:301

Per-batch options accepted by `executor.executeBatch(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-calls"></a> `calls` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | - | packages/tools/src/executor/executor.ts:302 |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Run-level capability restriction (D2 - single-writer constraint). `'read-only'` deterministically blocks every `side-effecting` / `external-stateful` tool with a `capability_blocked` outcome, no matter what the model asked for - the enforcement half of the agent-side advertise filter. Absent ⇒ all capabilities (legacy). | packages/tools/src/executor/executor.ts:321 |
| <a id="property-disablerepair"></a> `disableRepair?` | `readonly` | `boolean` | Disable the single-round repair hook for this batch (tools-02). Used for PRE-APPROVED calls replayed on a durable-HITL resume: a human granted exactly these args, so a repair rewrite must fail as `invalid_input` rather than execute a payload nobody saw. | packages/tools/src/executor/executor.ts:313 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/executor.ts:303 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/tools/src/executor/executor.ts:304 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md) | Trust level for the per-tool sandbox resolution. Default `'user-defined'`. | packages/tools/src/executor/executor.ts:306 |
