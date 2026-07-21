[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [preferred-model](/api/@graphorin/agent/preferred-model/index.md) / PreferredModelResolution

# Interface: PreferredModelResolution

Defined in: packages/agent/src/preferred-model/index.ts:35

**`Stable`**

Result returned by [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fallthroughreason"></a> `fallthroughReason?` | `readonly` | \| `"tier-not-mapped"` \| `"provider-unavailable"` \| `"override-takes-precedence"` | packages/agent/src/preferred-model/index.ts:52 |
| <a id="property-hintapplied"></a> `hintApplied?` | `readonly` | [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | packages/agent/src/preferred-model/index.ts:51 |
| <a id="property-resolvedmodelid"></a> `resolvedModelId` | `readonly` | `string` | packages/agent/src/preferred-model/index.ts:37 |
| <a id="property-resolvedprovider"></a> `resolvedProvider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | packages/agent/src/preferred-model/index.ts:36 |
| <a id="property-source"></a> `source` | `readonly` | \| `"prepare-step"` \| `"tier-map"` \| `"spec"` \| `"agent-preferred"` \| `"fallthrough-default"` \| `"pinned"` | packages/agent/src/preferred-model/index.ts:38 |
