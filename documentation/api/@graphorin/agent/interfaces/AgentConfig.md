[**Graphorin API reference v0.1.0**](../../../index.md)

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
| <a id="property-causalitymonitor"></a> `causalityMonitor?` | `readonly` | [`CausalityMonitorConfig`](/api/@graphorin/agent/interfaces/CausalityMonitorConfig.md) | - | packages/agent/src/types.ts:170 |
| <a id="property-checkpointstore"></a> `checkpointStore?` | `readonly` | [`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md) | - | packages/agent/src/types.ts:174 |
| <a id="property-contextengine"></a> `contextEngine?` | `readonly` | [`ContextEngineConfig`](/api/@graphorin/memory/interfaces/ContextEngineConfig.md) | - | packages/agent/src/types.ts:154 |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | packages/agent/src/types.ts:178 |
| <a id="property-fallbackmodels"></a> `fallbackModels?` | `readonly` | readonly [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)[] | - | packages/agent/src/types.ts:156 |
| <a id="property-fallbackpolicy"></a> `fallbackPolicy?` | `readonly` | [`AgentFallbackPolicy`](/api/@graphorin/agent/fallback/interfaces/AgentFallbackPolicy.md) | - | packages/agent/src/types.ts:157 |
| <a id="property-guardrails"></a> `guardrails?` | `readonly` | \{ `input?`: readonly [`InputGuardrail`](/api/@graphorin/agent/type-aliases/InputGuardrail.md)[]; `output?`: readonly [`OutputGuardrail`](/api/@graphorin/agent/type-aliases/OutputGuardrail.md)\&lt;`TOutput`\&gt;[]; \} | - | packages/agent/src/types.ts:147 |
| `guardrails.input?` | `readonly` | readonly [`InputGuardrail`](/api/@graphorin/agent/type-aliases/InputGuardrail.md)[] | - | packages/agent/src/types.ts:148 |
| `guardrails.output?` | `readonly` | readonly [`OutputGuardrail`](/api/@graphorin/agent/type-aliases/OutputGuardrail.md)\&lt;`TOutput`\&gt;[] | - | packages/agent/src/types.ts:149 |
| <a id="property-handoffs"></a> `handoffs?` | `readonly` | readonly `HandoffEntry`\&lt;`TDeps`\&gt;[] | - | packages/agent/src/types.ts:145 |
| <a id="property-instructions"></a> `instructions` | `readonly` | `string` \| ((`ctx`) => `string` \| `Promise`\&lt;`string`\&gt;) | - | packages/agent/src/types.ts:140 |
| <a id="property-maxparalleltools"></a> `maxParallelTools?` | `readonly` | `number` | - | packages/agent/src/types.ts:155 |
| <a id="property-memory"></a> `memory?` | `readonly` | [`Memory`](/api/@graphorin/memory/facade/interfaces/Memory.md) | - | packages/agent/src/types.ts:144 |
| <a id="property-mergeguard"></a> `mergeGuard?` | `readonly` | [`MergeGuardConfig`](/api/@graphorin/agent/interfaces/MergeGuardConfig.md) | - | packages/agent/src/types.ts:171 |
| <a id="property-modeltierautoclassification"></a> `modelTierAutoClassification?` | `readonly` | `boolean` | - | packages/agent/src/types.ts:160 |
| <a id="property-modeltiermap"></a> `modelTierMap?` | `readonly` | `Partial`\<`Record`\&lt;[`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md), [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)\&gt;\> | - | packages/agent/src/types.ts:159 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/agent/src/types.ts:139 |
| <a id="property-outputtype"></a> `outputType?` | `readonly` | [`OutputSpec`](/api/@graphorin/agent/interfaces/OutputSpec.md)\&lt;`TOutput`\&gt; | - | packages/agent/src/types.ts:146 |
| <a id="property-preferredmodel"></a> `preferredModel?` | `readonly` | \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) | - | packages/agent/src/types.ts:158 |
| <a id="property-preparestep"></a> `prepareStep?` | `readonly` | [`PrepareStepHook`](/api/@graphorin/agent/type-aliases/PrepareStepHook.md)\&lt;`TDeps`\&gt; | - | packages/agent/src/types.ts:153 |
| <a id="property-protocolguard"></a> `protocolGuard?` | `readonly` | [`ProtocolGuardConfig`](/api/@graphorin/agent/interfaces/ProtocolGuardConfig.md) | - | packages/agent/src/types.ts:172 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | - | packages/agent/src/types.ts:141 |
| <a id="property-reasoningretention"></a> `reasoningRetention?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Per-agent override of the per-provider auto-detected [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) default. Wins over the provider- level default when both are present. The agent runtime feeds the effective value into every `provider.stream(...)` call so the wire-correct contract is honoured per RB-42 / suggested DEC-158 / suggested ADR-046. | packages/agent/src/types.ts:169 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/agent/src/types.ts:175 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/agent/src/types.ts:176 |
| <a id="property-skills"></a> `skills?` | `readonly` | [`SkillsRegistryLike`](/api/@graphorin/agent/interfaces/SkillsRegistryLike.md) | - | packages/agent/src/types.ts:143 |
| <a id="property-stopwhen"></a> `stopWhen?` | `readonly` | [`StopCondition`](/api/@graphorin/core/interfaces/StopCondition.md) | - | packages/agent/src/types.ts:151 |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | - | packages/agent/src/types.ts:152 |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `TDeps`\&gt;[] | - | packages/agent/src/types.ts:142 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/agent/src/types.ts:173 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/types.ts:177 |
