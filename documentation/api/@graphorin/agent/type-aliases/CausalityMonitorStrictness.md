[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CausalityMonitorStrictness

# Type Alias: CausalityMonitorStrictness

```ts
type CausalityMonitorStrictness = "off" | "detect" | "detect-and-flag" | "detect-and-block";
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:24

Operator-tunable strictness level. Default `'detect-and-flag'`
for cloud-tier providers; `'detect'` for loopback providers;
`'off'` for v0.1-alpha backward compatibility.

## Stable
