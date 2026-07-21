[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintLedger

# Interface: TaintLedger

Defined in: packages/security/src/dataflow/types.ts:123

**`Stable`**

Per-run taint state. Records the provenance of each tool output and
answers two questions a sink check needs: *has untrusted/sensitive
content entered this run?* and *do these specific arguments carry
untrusted content verbatim?*

Implementations are stateful and run-scoped; create one per run.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | `true` once any secret-tier output has entered the run. | packages/security/src/dataflow/types.ts:150 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | `true` once any untrusted-source output has entered the run. | packages/security/src/dataflow/types.ts:148 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | Distinct untrusted source kinds observed so far. | packages/security/src/dataflow/types.ts:152 |

## Methods

### inspectArgs()

```ts
inspectArgs(argsText): ArgsTaintProbe;
```

Defined in: packages/security/src/dataflow/types.ts:146

Probe a sink's serialized arguments for verbatim untrusted carry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `argsText` | `string` |

#### Returns

[`ArgsTaintProbe`](/api/@graphorin/security/interfaces/ArgsTaintProbe.md)

***

### recordAssistantOutput()?

```ts
optional recordAssistantOutput(text): void;
```

Defined in: packages/security/src/dataflow/types.ts:134

C6: record the MODEL's own output as derived-untrusted once untrusted
content has entered the run. Tracks the text as untrusted spans (source
kind `'llm-derived'`) so a later sink call whose args copy the model's
paraphrase-adjacent phrasing still trips the verbatim probe. No-op
while the run is untainted. Optional so third-party ledgers keep
compiling; the built-in ledger implements it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`void`

***

### recordInboundMessage()?

```ts
optional recordInboundMessage(label, text): void;
```

Defined in: packages/security/src/dataflow/types.ts:144

B1.5: record message-borne input (channel inbound) with the same
widening semantics as [TaintLedger.recordOutput](/api/@graphorin/security/interfaces/TaintLedger.md#recordoutput). A dedicated
entry point because the Rule-of-Two deliberately excludes ordinary
user MESSAGES from the untrusted-input leg - channel messages come
from an authenticated-but-content-untrusted peer and must arm the
gate. Optional so third-party ledgers keep compiling; the built-in
ledger implements it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | [`TaintLabel`](/api/@graphorin/security/interfaces/TaintLabel.md) |
| `text` | `string` |

#### Returns

`void`

***

### recordOutput()

```ts
recordOutput(label, outputText): void;
```

Defined in: packages/security/src/dataflow/types.ts:125

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

Defined in: packages/security/src/dataflow/types.ts:160

Coarse, serializable summary of the load-bearing trifecta-gate signal -
the `untrusted`/`sensitive`/source-kind flags only, **never** the tracked
verbatim spans (those are untrusted text and must not be persisted). Used
to rehydrate the ledger across a suspend/resume so the sink gate is not
silently weakened on the HITL boundary.

#### Returns

[`TaintLedgerSnapshot`](/api/@graphorin/security/interfaces/TaintLedgerSnapshot.md)
