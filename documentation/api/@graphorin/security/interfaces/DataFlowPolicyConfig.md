[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowPolicyConfig

# Interface: DataFlowPolicyConfig

Defined in: packages/security/src/dataflow/types.ts:192

**`Stable`**

Configuration for [createDataFlowPolicy](/api/@graphorin/security/functions/createDataFlowPolicy.md). Also the shape an agent
accepts on `AgentConfig.dataFlowPolicy`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-declassifysinks"></a> `declassifySinks?` | `readonly` | readonly `string`[] | Sink tool names pre-authorized by the operator to receive tainted data. A tainted flow into one of these is audited as `declassified` and allowed even in `'enforce'` mode - the explicit, audited escape hatch for known-good flows. | packages/security/src/dataflow/types.ts:226 |
| <a id="property-derivedtaint"></a> `derivedTaint?` | `readonly` | `"off"` \| `"strict"` | Derived-taint propagation mode. - `'off'` (default) - current behaviour: sinks gate on verbatim carry and (optionally) the lethal trifecta. - `'strict'` - CaMeL-style control-flow integrity: once untrusted content has entered the run, EVERY model-driven sink call fires the `derived-untrusted-to-sink` flow (paraphrase-robust by construction). Deliberately coarse - in `'enforce'` mode this blocks all post-ingestion sinks except `declassifySinks`; pair with shadow mode first to size the impact. | packages/security/src/dataflow/types.ts:247 |
| <a id="property-guardtrifecta"></a> `guardTrifecta?` | `readonly` | `boolean` | When `true` (the default), also gate on the conservative [lethal-trifecta](/api/@graphorin/security/type-aliases/TaintFlowKind.md) signal, not only on verbatim `untrusted-to-sink` carry. Set `false` to gate exclusively on provable verbatim flow (fewer false positives, weaker guarantee). | packages/security/src/dataflow/types.ts:201 |
| <a id="property-minspanlength"></a> `minSpanLength?` | `readonly` | `number` | Minimum length of a shared verbatim span (in normalized characters) for the ledger to treat a sink's arguments as carrying untrusted content. Lower = more sensitive (more false positives), clamped up to an 8-char floor below which the probe cannot be meaningful. Default `20`. | packages/security/src/dataflow/types.ts:234 |
| <a id="property-mode"></a> `mode` | `readonly` | [`DataFlowMode`](/api/@graphorin/security/type-aliases/DataFlowMode.md) | Enforcement mode. See [DataFlowMode](/api/@graphorin/security/type-aliases/DataFlowMode.md). | packages/security/src/dataflow/types.ts:194 |
| <a id="property-sensitivetiers"></a> `sensitiveTiers?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity tiers that arm the lethal-trifecta `sensitive` leg. Default `['secret']` (out-of-the-box behaviour is byte-identical - only secret-tagged content counts). Set e.g. `['secret', 'internal']` so ordinary user/PII content (default `'internal'`) also counts; the agent's guard builder threads this into `deriveTaintLabel`. The verbatim `untrusted-to-sink` leg is independent of this option. | packages/security/src/dataflow/types.ts:211 |
| <a id="property-treatpiiassensitive"></a> `treatPiiAsSensitive?` | `readonly` | `boolean` | FIDES-lattice: when `true`, a tool output that the PII catalogue flags (email, SSN, card, …) arms the lethal-trifecta `sensitive` leg even without a `'secret'` tag - so exfiltrating user/PII content trips the gate. The agent's guard builder wires `containsPii` into the ledger. Default `false` ⇒ byte-identical. Composes with [sensitiveTiers](/api/@graphorin/security/interfaces/DataFlowPolicyConfig.md#property-sensitivetiers). | packages/security/src/dataflow/types.ts:219 |
