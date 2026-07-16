[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / GuardOutcome

# Interface: GuardOutcome

Defined in: [packages/agent/src/lateral-leak/protocol-guard.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L107)

Outcome of [guardOutboundContent](/api/@graphorin/agent/functions/guardOutboundContent.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-boundary"></a> `boundary` | `readonly` | [`ProtocolBoundary`](/api/@graphorin/agent/type-aliases/ProtocolBoundary.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L112) |
| <a id="property-content"></a> `content` | `readonly` | `string` | [packages/agent/src/lateral-leak/protocol-guard.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L108) |
| <a id="property-decision"></a> `decision` | `readonly` | `"pass-through"` \| `"escaped"` \| `"replaced"` \| `"rejected"` | [packages/agent/src/lateral-leak/protocol-guard.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L111) |
| <a id="property-escapedcharcount"></a> `escapedCharCount` | `readonly` | `number` | [packages/agent/src/lateral-leak/protocol-guard.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L109) |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | [packages/agent/src/lateral-leak/protocol-guard.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L110) |
| <a id="property-policy"></a> `policy` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L113) |
