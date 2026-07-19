[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / InboundTaintSeed

# Interface: InboundTaintSeed

Defined in: packages/agent/src/types.ts:558

**`Stable`**

B1.5: message-borne untrusted input entering a run from a channel
gateway. Stamped into the run's taint ledger at init, BEFORE the
first step, so the data-flow policy's untrusted leg is armed even
though the input arrives as a user MESSAGE rather than a tool
output (the Rule-of-Two deliberately excludes ordinary user
messages; channel peers are authenticated but their CONTENT is
attacker-influenceable). Widen-only: it can add taint, never clear
it.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitive"></a> `sensitive?` | `readonly` | `boolean` | Also arm the sensitive leg (rare; widen-only). | packages/agent/src/types.ts:570 |
| <a id="property-sourcekind"></a> `sourceKind?` | `readonly` | `string` | Descriptive source kind for audit trails, e.g. `'channel:telegram'`. Default `'channel-inbound'`. | packages/agent/src/types.ts:568 |
| <a id="property-text"></a> `text` | `readonly` | `string` | The untrusted inbound text. Recorded as verbatim spans so a later sink call whose args copy the channel text trips the probe. | packages/agent/src/types.ts:563 |
