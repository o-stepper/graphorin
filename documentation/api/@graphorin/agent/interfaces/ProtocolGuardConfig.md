[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ProtocolGuardConfig

# Interface: ProtocolGuardConfig

Defined in: [packages/agent/src/lateral-leak/protocol-guard.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L47)

Configurable per-boundary policy table. There is no `AgentConfig` knob
for this; operators override specific boundaries by passing a
`ProtocolGuardConfig` to `guardOutboundContent(...)` / `resolvePolicy(...)`
when wiring server boundaries (SSE / session export).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L52) |
| <a id="property-httpheader"></a> `httpHeader?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L49) |
| <a id="property-restbody"></a> `restBody?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L51) |
| <a id="property-sse"></a> `sse?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L48) |
| <a id="property-ws"></a> `ws?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | [packages/agent/src/lateral-leak/protocol-guard.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L50) |
