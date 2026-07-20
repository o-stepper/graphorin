[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CausalityMonitorCheck

# Interface: CausalityMonitorCheck

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:66

**`Stable`**

Result returned by [CausalityMonitor.checkMessage](/api/@graphorin/agent/classes/CausalityMonitor.md#checkmessage).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain` | `readonly` | readonly `string`[] | packages/agent/src/lateral-leak/causality-monitor.ts:69 |
| <a id="property-decision"></a> `decision` | `readonly` | `"detect"` \| `"block"` \| `"flag"` \| `"strip"` | packages/agent/src/lateral-leak/causality-monitor.ts:71 |
| <a id="property-leakdetected"></a> `leakDetected` | `readonly` | `boolean` | packages/agent/src/lateral-leak/causality-monitor.ts:67 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/agent/src/lateral-leak/causality-monitor.ts:70 |
| <a id="property-severity"></a> `severity` | `readonly` | `"info"` \| `"warn"` \| `"block"` | packages/agent/src/lateral-leak/causality-monitor.ts:68 |
| <a id="property-vector"></a> `vector` | `readonly` | [`LateralLeakVector`](/api/@graphorin/core/type-aliases/LateralLeakVector.md) | packages/agent/src/lateral-leak/causality-monitor.ts:72 |
