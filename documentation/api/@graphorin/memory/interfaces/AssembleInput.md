[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AssembleInput

# Interface: AssembleInput

Defined in: packages/memory/src/context-engine/engine.ts:185

Per-call runtime context handed to [ContextEngine.assemble](/api/@graphorin/memory/interfaces/ContextEngine.md#assemble).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:187 |
| <a id="property-agentinstructions"></a> `agentInstructions?` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:190 |
| <a id="property-autorecallstrategyoverride"></a> `autoRecallStrategyOverride?` | `readonly` | [`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md) | - | packages/memory/src/context-engine/engine.ts:197 |
| <a id="property-lastusermessage"></a> `lastUserMessage?` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:196 |
| <a id="property-proceduralactivation"></a> `proceduralActivation?` | `readonly` | \{ `tags?`: readonly `string`[]; `topic?`: `string`; \} | - | packages/memory/src/context-engine/engine.ts:192 |
| `proceduralActivation.tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/context-engine/engine.ts:194 |
| `proceduralActivation.topic?` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:193 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:189 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/context-engine/engine.ts:186 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/memory/src/context-engine/engine.ts:188 |
| <a id="property-skills"></a> `skills?` | `readonly` | readonly [`SkillMetadataCard`](/api/@graphorin/memory/interfaces/SkillMetadataCard.md)[] | - | packages/memory/src/context-engine/engine.ts:191 |
| <a id="property-upstreamannotations"></a> `upstreamAnnotations?` | `readonly` | readonly [`ContentAnnotation`](/api/@graphorin/memory/interfaces/ContentAnnotation.md)[] | Optional inbound-trust annotations carried by upstream messages (`session_messages` rows tagged by Phase 12 / Phase 07 / Phase 09). When at least one part has `inboundTrust !== 'trusted' && inboundTrust !== 'n/a'`, the per-step preamble fires (see RB-43 / DEC-159). | packages/memory/src/context-engine/engine.ts:205 |
