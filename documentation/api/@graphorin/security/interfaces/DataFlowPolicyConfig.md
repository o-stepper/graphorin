[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowPolicyConfig

# Interface: DataFlowPolicyConfig

Defined in: packages/security/src/dataflow/types.ts:131

Configuration for [createDataFlowPolicy](/api/@graphorin/security/functions/createDataFlowPolicy.md). Also the shape an agent
accepts on `AgentConfig.dataFlowPolicy`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-declassifysinks"></a> `declassifySinks?` | `readonly` | readonly `string`[] | Sink tool names pre-authorized by the operator to receive tainted data. A tainted flow into one of these is audited as `declassified` and allowed even in `'enforce'` mode — the explicit, audited escape hatch for known-good flows. | packages/security/src/dataflow/types.ts:147 |
| <a id="property-guardtrifecta"></a> `guardTrifecta?` | `readonly` | `boolean` | When `true` (the default), also gate on the conservative [lethal-trifecta](/api/@graphorin/security/type-aliases/TaintFlowKind.md) signal, not only on verbatim `untrusted-to-sink` carry. Set `false` to gate exclusively on provable verbatim flow (fewer false positives, weaker guarantee). | packages/security/src/dataflow/types.ts:140 |
| <a id="property-minspanlength"></a> `minSpanLength?` | `readonly` | `number` | Minimum length of a shared verbatim span (in normalized characters) for the ledger to treat a sink's arguments as carrying untrusted content. Lower = more sensitive (more false positives). Default `20`. | packages/security/src/dataflow/types.ts:153 |
| <a id="property-mode"></a> `mode` | `readonly` | [`DataFlowMode`](/api/@graphorin/security/type-aliases/DataFlowMode.md) | Enforcement mode. See [DataFlowMode](/api/@graphorin/security/type-aliases/DataFlowMode.md). | packages/security/src/dataflow/types.ts:133 |
