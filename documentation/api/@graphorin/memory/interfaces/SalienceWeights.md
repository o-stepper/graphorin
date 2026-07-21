[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SalienceWeights

# Interface: SalienceWeights

Defined in: packages/memory/src/consolidator/decay.ts:94

**`Stable`**

Tunable weights for the multi-signal `salience` score.
Each weight is the *magnitude* of the corresponding signal's pull on
the retention curve; all default to values chosen so the ordering is
sensible without ever inverting it.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-accessreinforcement"></a> `accessReinforcement?` | `readonly` | `number` | Retrieval-frequency reinforcement - the use-it-or-lose-it signal. How strongly the monotonic access counter stretches retention: the factor is `1 + weight * min(1, log1p(count) / log1p(saturation))`, saturating at `ACCESS_REINFORCEMENT_SATURATION` accesses. At the default `0` the factor is exactly `1` - behaviour is byte-identical until an operator opts in (e.g. `0.3` ⇒ a heavily-used fact keeps up to 1.3x its retention). Optional so existing weight literals stay valid. | packages/memory/src/consolidator/decay.ts:125 |
| <a id="property-foreignprovenance"></a> `foreignProvenance` | `readonly` | `number` | Mild penalty for a fact with non-first-party provenance - e.g. `'tool'` / `'imported'` content that did not originate with the user. At the default `0.2` such a fact keeps `0.8` of its retention. | packages/memory/src/consolidator/decay.ts:114 |
| <a id="property-importance"></a> `importance` | `readonly` | `number` | How strongly importance stretches retention. At the default `0.6`, importance `1.0` multiplies retention by `1.3` and importance `0.0` by `0.7`; neutral importance leaves it unchanged. | packages/memory/src/consolidator/decay.ts:100 |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | `number` | Penalty applied to a **quarantined** fact - the explicit security-risk negative term. At the default `0.7`, a quarantined fact keeps only `0.3` of its retention, so it is evicted first under capacity pressure. Never a hard delete: the fact is archived, recoverable, and quarantine still gates it out of recall meanwhile. | packages/memory/src/consolidator/decay.ts:108 |
