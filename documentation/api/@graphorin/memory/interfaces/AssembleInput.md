[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AssembleInput

# Interface: AssembleInput

Defined in: [packages/memory/src/context-engine/io-types.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L34)

Input to [ContextEngine.assemble](/api/@graphorin/memory/interfaces/ContextEngine.md#assemble).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L36) |
| <a id="property-agentinstructions"></a> `agentInstructions?` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L39) |
| <a id="property-autorecallstrategyoverride"></a> `autoRecallStrategyOverride?` | `readonly` | [`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md) | - | [packages/memory/src/context-engine/io-types.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L46) |
| <a id="property-lastusermessage"></a> `lastUserMessage?` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L45) |
| <a id="property-proceduralactivation"></a> `proceduralActivation?` | `readonly` | \{ `tags?`: readonly `string`[]; `topic?`: `string`; \} | - | [packages/memory/src/context-engine/io-types.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L41) |
| `proceduralActivation.tags?` | `readonly` | readonly `string`[] | - | [packages/memory/src/context-engine/io-types.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L43) |
| `proceduralActivation.topic?` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L42) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L38) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/context-engine/io-types.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L35) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [packages/memory/src/context-engine/io-types.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L37) |
| <a id="property-skills"></a> `skills?` | `readonly` | readonly [`SkillMetadataCard`](/api/@graphorin/memory/interfaces/SkillMetadataCard.md)[] | - | [packages/memory/src/context-engine/io-types.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L40) |
| <a id="property-upstreamannotations"></a> `upstreamAnnotations?` | `readonly` | readonly [`ContentAnnotation`](/api/@graphorin/memory/interfaces/ContentAnnotation.md)[] | Optional inbound-trust annotations carried by upstream messages (`session_messages` rows tagged by Phase 12 / Phase 07 / Phase 09). When at least one part has `inboundTrust !== 'trusted' && inboundTrust !== 'n/a'`, the per-step preamble fires (see RB-43 / DEC-159). | [packages/memory/src/context-engine/io-types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/io-types.ts#L54) |
