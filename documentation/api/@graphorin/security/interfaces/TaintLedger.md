[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintLedger

# Interface: TaintLedger

Defined in: packages/security/src/dataflow/types.ts:112

Per-run taint state. Records the provenance of each tool output and
answers two questions a sink check needs: *has untrusted/sensitive
content entered this run?* and *do these specific arguments carry
untrusted content verbatim?*

Implementations are stateful and run-scoped; create one per run.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | `true` once any secret-tier output has entered the run. | packages/security/src/dataflow/types.ts:120 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | `true` once any untrusted-source output has entered the run. | packages/security/src/dataflow/types.ts:118 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | Distinct untrusted source kinds observed so far. | packages/security/src/dataflow/types.ts:122 |

## Methods

### inspectArgs()

```ts
inspectArgs(argsText): ArgsTaintProbe;
```

Defined in: packages/security/src/dataflow/types.ts:116

Probe a sink's serialized arguments for verbatim untrusted carry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `argsText` | `string` |

#### Returns

[`ArgsTaintProbe`](/api/@graphorin/security/interfaces/ArgsTaintProbe.md)

***

### recordOutput()

```ts
recordOutput(label, outputText): void;
```

Defined in: packages/security/src/dataflow/types.ts:114

Record one tool output's provenance (and its text, if untrusted).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | [`TaintLabel`](/api/@graphorin/security/interfaces/TaintLabel.md) |
| `outputText` | `string` |

#### Returns

`void`

***

### snapshot()

```ts
snapshot(): TaintLedgerSnapshot;
```

Defined in: packages/security/src/dataflow/types.ts:130

Coarse, serializable summary of the load-bearing trifecta-gate signal —
the `untrusted`/`sensitive`/source-kind flags only, **never** the tracked
verbatim spans (those are untrusted text and must not be persisted). Used
to rehydrate the ledger across a suspend/resume so the sink gate is not
silently weakened on the HITL boundary (AG-19).

#### Returns

[`TaintLedgerSnapshot`](/api/@graphorin/security/interfaces/TaintLedgerSnapshot.md)
