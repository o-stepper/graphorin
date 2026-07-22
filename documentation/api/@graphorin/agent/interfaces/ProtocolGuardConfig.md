[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ProtocolGuardConfig

# Interface: ProtocolGuardConfig

Defined in: packages/agent/src/lateral-leak/protocol-guard.ts:47

**`Stable`**

Configurable per-boundary policy table. There is no `AgentConfig` knob
for this; operators override specific boundaries by passing a
`ProtocolGuardConfig` to `guardOutboundContent(...)` / `resolvePolicy(...)`
when wiring server boundaries (SSE / session export).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:52 |
| <a id="property-httpheader"></a> `httpHeader?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:49 |
| <a id="property-restbody"></a> `restBody?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:51 |
| <a id="property-sse"></a> `sse?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:48 |
| <a id="property-ws"></a> `ws?` | `readonly` | [`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md) | packages/agent/src/lateral-leak/protocol-guard.ts:50 |
