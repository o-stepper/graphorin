[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentConfig

# Interface: AgentConfig\&lt;TDeps, TOutput\&gt;

Defined in: packages/agent/src/types.ts:138

The full options object accepted by [createAgent](/api/@graphorin/agent/factory/functions/createAgent.md).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autoassemblecontext"></a> `autoAssembleContext?` | `readonly` | `boolean` | Opt in to building the per-run system prompt from the memory ContextEngine (CE-1). When `true` **and** `memory` is wired, the runtime calls `memory.contextEngine.assemble(...)` once at run start: the agent's `instructions` become Layer 2 and the engine prepends the memory base and appends working blocks, procedural rules, skill cards, the metadata counts, and — when `factsAutoRecall` is configured — auto-recalled facts. Defaults `false`: the prompt is built from `instructions` alone and the model reaches memory only through the memory tools it calls (the documented explicit pattern). Has no effect without `memory`. | packages/agent/src/types.ts:163 |
| <a id="property-causalitymonitor"></a> `causalityMonitor?` | `readonly` | [`CausalityMonitorConfig`](/api/@graphorin/agent/interfaces/CausalityMonitorConfig.md) | - | packages/agent/src/types.ts:221 |
| <a id="property-checkpointstore"></a> `checkpointStore?` | `readonly` | [`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md) | - | packages/agent/src/types.ts:261 |
| <a id="property-dataflowpolicy"></a> `dataFlowPolicy?` | `readonly` | [`DataFlowPolicyConfig`](/api/@graphorin/security/interfaces/DataFlowPolicyConfig.md) | Provenance / taint-based data-flow policy (P1-3, opt-in). Enforces data-flow rules at the tool-execution boundary using the provenance Graphorin already tracks (trust class + source + sensitivity), to defuse the lethal trifecta: a sink (`side-effecting` / `external-stateful` tool) is blocked when untrusted content flows into it verbatim, or — conservatively — when it fires while both untrusted content and secret-tier data are present in the run. - `mode: 'shadow'` — audit-only; tainted flows are flagged (`tool:dataflow:flagged` audit + counter) but never blocked. Ship this first to surface false positives. - `mode: 'enforce'` — tainted flows are blocked (the sink does not run; the call yields a `dataflow_policy_blocked` error) unless the sink is listed in `declassifySinks` (an audited operator override). Composes with `'code-mode'`: each in-script tool call flows through the same executor gate. Absent (the default) leaves the loop unchanged. | packages/agent/src/types.ts:250 |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | packages/agent/src/types.ts:265 |
| <a id="property-fallbackmodels"></a> `fallbackModels?` | `readonly` | readonly [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)[] | - | packages/agent/src/types.ts:208 |
| <a id="property-fallbackpolicy"></a> `fallbackPolicy?` | `readonly` | [`AgentFallbackPolicy`](/api/@graphorin/agent/fallback/interfaces/AgentFallbackPolicy.md) | - | packages/agent/src/types.ts:209 |
| <a id="property-guardrails"></a> `guardrails?` | `readonly` | \{ `input?`: readonly [`InputGuardrail`](/api/@graphorin/agent/type-aliases/InputGuardrail.md)\&lt;`string`\&gt;[]; `output?`: readonly [`OutputGuardrail`](/api/@graphorin/agent/type-aliases/OutputGuardrail.md)\&lt;`TOutput`\&gt;[]; \} | Deterministic checks run by the loop (AG-2; canonical contract is `@graphorin/security`'s `GuardrailDefinition` — SDF-4). - `input` guardrails run over each **fresh-run seed user message** (string content) before the first provider call. `'block'` fails the run (`guardrail-blocked`) without reaching the model; `'rewrite'` replaces the message content (mirrored into the persisted `RunState`); `'warn'` logs and continues. - `output` guardrails run over the **final output** on the completed path before `agent.end`. `'block'` fails the run; `'rewrite'` replaces `result.output` (text deltas were already streamed — the rewrite governs the durable result, not the live token stream). Every trip emits a `guardrail.tripped` event. | packages/agent/src/types.ts:183 |
| `guardrails.input?` | `readonly` | readonly [`InputGuardrail`](/api/@graphorin/agent/type-aliases/InputGuardrail.md)\&lt;`string`\&gt;[] | - | packages/agent/src/types.ts:184 |
| `guardrails.output?` | `readonly` | readonly [`OutputGuardrail`](/api/@graphorin/agent/type-aliases/OutputGuardrail.md)\&lt;`TOutput`\&gt;[] | - | packages/agent/src/types.ts:185 |
| <a id="property-handoffs"></a> `handoffs?` | `readonly` | readonly `HandoffEntry`\&lt;`TDeps`\&gt;[] | - | packages/agent/src/types.ts:164 |
| <a id="property-instructions"></a> `instructions` | `readonly` | `string` \| ((`ctx`) => `string` \| `Promise`\&lt;`string`\&gt;) | The agent's system prompt. A string is used verbatim; a function is resolved **once per run** (sync or async, awaited) against a [RunContext](/api/@graphorin/core/interfaces/RunContext.md) snapshot at step 0, and its result is pinned as the run's system-prompt prefix for the whole run (it is not re-evaluated per step). An empty string injects no system message. | packages/agent/src/types.ts:147 |
| <a id="property-maxparalleltools"></a> `maxParallelTools?` | `readonly` | `number` | - | packages/agent/src/types.ts:190 |
| <a id="property-memory"></a> `memory?` | `readonly` | [`Memory`](/api/@graphorin/memory/facade/interfaces/Memory.md) | - | packages/agent/src/types.ts:151 |
| <a id="property-mergeguard"></a> `mergeGuard?` | `readonly` | [`MergeGuardConfig`](/api/@graphorin/agent/interfaces/MergeGuardConfig.md) | Sideways-injection merge guard for `agent.fanOut` `'judge-merge'` (AG-7): scores per-child source trust × contribution weight against the judge's merged output; a biased merge emits `agent.lateral-leak.detected` and `'detect-and-block'` throws `MergeBlockedError`. | packages/agent/src/types.ts:229 |
| <a id="property-modeltiermap"></a> `modelTierMap?` | `readonly` | `Partial`\<`Record`\&lt;[`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md), [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)\&gt;\> | - | packages/agent/src/types.ts:211 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/agent/src/types.ts:139 |
| <a id="property-outputtype"></a> `outputType?` | `readonly` | [`OutputSpec`](/api/@graphorin/agent/interfaces/OutputSpec.md)\&lt;`TOutput`\&gt; | - | packages/agent/src/types.ts:165 |
| <a id="property-preferredmodel"></a> `preferredModel?` | `readonly` | \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) | - | packages/agent/src/types.ts:210 |
| <a id="property-preparestep"></a> `prepareStep?` | `readonly` | [`PrepareStepHook`](/api/@graphorin/agent/type-aliases/PrepareStepHook.md)\&lt;`TDeps`\&gt; | - | packages/agent/src/types.ts:189 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | - | packages/agent/src/types.ts:148 |
| <a id="property-reasoningretention"></a> `reasoningRetention?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Per-agent override of the per-provider auto-detected [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) default. Wins over the provider- level default when both are present. The agent runtime feeds the effective value into every `provider.stream(...)` call so the wire-correct contract is honoured per RB-42 / suggested DEC-158 / suggested ADR-046. | packages/agent/src/types.ts:220 |
| <a id="property-resultreaders"></a> `resultReaders?` | `readonly` | readonly [`ResultReader`](/api/@graphorin/tools/interfaces/ResultReader.md)[] | Additional result-handle readers (P1-4 / WI-13), tried after the built-in spill-file reader. Wire an MCP resource reader (`createMcpResourceReader` from `@graphorin/mcp/client`) here so the model can resolve an MCP `resource_link` on demand via the built-in `read_result` tool, instead of inlining the resource body. Supplying any reader force-registers `read_result` even when no tool spills. | packages/agent/src/types.ts:259 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/agent/src/types.ts:262 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/agent/src/types.ts:263 |
| <a id="property-skills"></a> `skills?` | `readonly` | [`SkillsRegistryLike`](/api/@graphorin/agent/interfaces/SkillsRegistryLike.md) | - | packages/agent/src/types.ts:150 |
| <a id="property-stopwhen"></a> `stopWhen?` | `readonly` | [`StopCondition`](/api/@graphorin/core/interfaces/StopCondition.md) | - | packages/agent/src/types.ts:187 |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | - | packages/agent/src/types.ts:188 |
| <a id="property-toolinvocation"></a> `toolInvocation?` | `readonly` | `"direct"` \| `"code-mode"` | How the model invokes tools (P1-2). - `'direct'` (default) — the model emits one provider tool-call per tool, each result inlined into the conversation. - `'code-mode'` — the agent advertises only the `code_execute` / `code_search` meta-tools; the model writes a script that calls tools in a sandbox via `tools.<name>(args)`, and **only the script's final result re-enters context** (intermediate results stay inside the sandbox). Each in-script call still runs through the executor, so per-tool ACL / sanitization / truncation apply. Approval-gated tools are not reachable from code-mode (there is no durable-HITL path mid-script); call those in `'direct'` mode. **Default** `'direct'` | packages/agent/src/types.ts:207 |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `TDeps`\&gt;[] | - | packages/agent/src/types.ts:149 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/agent/src/types.ts:260 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/types.ts:264 |
