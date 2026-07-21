[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createTaintLedger

# Function: createTaintLedger()

```ts
function createTaintLedger(opts?): TaintLedger;
```

Defined in: packages/security/src/dataflow/ledger.ts:92

**`Stable`**

Create a run-scoped [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md).

Verbatim detection is a bounded shingle intersection: an output is
tracked only when its normalized length is ≥ `minSpanLength`, and the
total tracked text is FIFO-capped at `maxTrackedChars` (oldest spans
evicted first). Comparison runs over an NFKC + alphanumeric-only fold,
so case, whitespace, inserted punctuation, zero-width and
fullwidth-homoglyph obfuscation do not defeat it. Detection is therefore
**best-effort** - it catches verbatim / near-verbatim forwarding of
untrusted content, not aggressive paraphrase or cross-script confusables,
and degrades gracefully past the budget. The conservative
[TaintLedger.untrustedSeen](/api/@graphorin/security/interfaces/TaintLedger.md#property-untrustedseen)/`sensitiveSeen` flags are never lossy:
they are the load-bearing signal for the lethal-trifecta gate.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | \{ `initial?`: [`TaintLedgerSnapshot`](/api/@graphorin/security/interfaces/TaintLedgerSnapshot.md); `maxTrackedChars?`: `number`; `minSpanLength?`: `number`; `piiSensitivity?`: (`text`) => `boolean`; \} | - |
| `opts.initial?` | [`TaintLedgerSnapshot`](/api/@graphorin/security/interfaces/TaintLedgerSnapshot.md) | Rehydrate the coarse trifecta-gate flags from a prior [TaintLedger.snapshot](/api/@graphorin/security/interfaces/TaintLedger.md#snapshot), so a resumed run does not start with an empty ledger that silently un-gates sinks exposed before the suspend. Spans are not restored (they are untrusted text and are not persisted), so the verbatim-carry probe restarts while the load-bearing gate is preserved. |
| `opts.maxTrackedChars?` | `number` | - |
| `opts.minSpanLength?` | `number` | - |
| `opts.piiSensitivity?` | (`text`) => `boolean` | FIDES-lattice: optional predicate run over each tool output. When it returns `true`, the read counts toward `sensitiveSeen` even if the tool's declared `sensitivity` is not `'secret'` - so PII/user-content exfiltration trips the lethal-trifecta leg. Wire `containsPii` here to opt in; omit for byte-identical behaviour. |

## Returns

[`TaintLedger`](/api/@graphorin/security/interfaces/TaintLedger.md)
