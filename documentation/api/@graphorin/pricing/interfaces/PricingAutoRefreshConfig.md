[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingAutoRefreshConfig

# Interface: PricingAutoRefreshConfig

Defined in: pricing/src/config.ts:15

**`Stable`**

Auto-refresh configuration. The `enabled` flag exists in the type
for forward compatibility but is **enforced false** in v0.1 per the
zero-default-telemetry policy: refreshing the snapshot makes an
outbound HTTP call, so it must remain an explicit user action.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-enabled"></a> `enabled` | `readonly` | `false` | Always `false` in v0.1. Reserved for v0.2+. | pricing/src/config.ts:17 |
| <a id="property-intervalhours"></a> `intervalHours?` | `readonly` | `number` | Suggested cadence for v0.2+. Ignored at runtime in v0.1. | pricing/src/config.ts:19 |
