[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [preferred-model](/api/@graphorin/agent/preferred-model/index.md) / PreferredModelResolution

# Interface: PreferredModelResolution

Defined in: packages/agent/src/preferred-model/index.ts:33

Result returned by [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fallthroughreason"></a> `fallthroughReason?` | `readonly` | \| `"tier-not-mapped"` \| `"provider-unavailable"` \| `"override-takes-precedence"` | packages/agent/src/preferred-model/index.ts:38 |
| <a id="property-hintapplied"></a> `hintApplied?` | `readonly` | [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | packages/agent/src/preferred-model/index.ts:37 |
| <a id="property-resolvedmodelid"></a> `resolvedModelId` | `readonly` | `string` | packages/agent/src/preferred-model/index.ts:35 |
| <a id="property-resolvedprovider"></a> `resolvedProvider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | packages/agent/src/preferred-model/index.ts:34 |
| <a id="property-source"></a> `source` | `readonly` | \| `"prepare-step"` \| `"tier-map"` \| `"spec"` \| `"agent-preferred"` \| `"fallthrough-default"` | packages/agent/src/preferred-model/index.ts:36 |
