[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CausalityMonitorConfig

# Interface: CausalityMonitorConfig

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:31

**`Stable`**

Per-agent configuration accepted by `createAgent({ causalityMonitor })`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-auditallchains"></a> `auditAllChains?` | `readonly` | `boolean` | When `true`, emit the chain on every `checkMessage(...)` call (high-cardinality; opt-in for compliance audits). Default `false` - only emit on detected leaks. | packages/agent/src/lateral-leak/causality-monitor.ts:42 |
| <a id="property-denialpatterns"></a> `denialPatterns?` | `readonly` | readonly `RegExp`[] | Operator-extensible denial patterns. | packages/agent/src/lateral-leak/causality-monitor.ts:36 |
| <a id="property-maxchaindepth"></a> `maxChainDepth?` | `readonly` | `number` | Maximum depth of the chain. Default `32`. | packages/agent/src/lateral-leak/causality-monitor.ts:34 |
| <a id="property-strictness"></a> `strictness` | `readonly` | [`CausalityMonitorStrictness`](/api/@graphorin/agent/type-aliases/CausalityMonitorStrictness.md) | - | packages/agent/src/lateral-leak/causality-monitor.ts:32 |
