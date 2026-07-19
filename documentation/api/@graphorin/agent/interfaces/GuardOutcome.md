[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / GuardOutcome

# Interface: GuardOutcome

Defined in: packages/agent/src/lateral-leak/protocol-guard.ts:107

**`Stable`**

Outcome of [guardOutboundContent](/api/@graphorin/agent/functions/guardOutboundContent.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-boundary"></a> `boundary` | `readonly` | [`ProtocolBoundary`](/api/@graphorin/agent/type-aliases/ProtocolBoundary.md) | packages/agent/src/lateral-leak/protocol-guard.ts:112 |
| <a id="property-content"></a> `content` | `readonly` | `string` | packages/agent/src/lateral-leak/protocol-guard.ts:108 |
| <a id="property-decision"></a> `decision` | `readonly` | `"pass-through"` \| `"escaped"` \| `"replaced"` \| `"rejected"` | packages/agent/src/lateral-leak/protocol-guard.ts:111 |
| <a id="property-escapedcharcount"></a> `escapedCharCount` | `readonly` | `number` | packages/agent/src/lateral-leak/protocol-guard.ts:109 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/agent/src/lateral-leak/protocol-guard.ts:110 |
| <a id="property-policy"></a> `policy` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:113 |
