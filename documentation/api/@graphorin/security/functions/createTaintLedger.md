[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createTaintLedger

# Function: createTaintLedger()

```ts
function createTaintLedger(opts?): TaintLedger;
```

Defined in: packages/security/src/dataflow/ledger.ts:60

Create a run-scoped [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md).

Verbatim detection is a bounded shingle intersection: an output is
tracked only when its normalized length is ≥ `minSpanLength`, and the
total tracked text is FIFO-capped at `maxTrackedChars` (oldest spans
evicted first). Detection is therefore **best-effort** — it catches
verbatim / near-verbatim forwarding of untrusted content, not
paraphrase, and degrades gracefully past the budget. The conservative
[TaintLedger.untrustedSeen](/api/@graphorin/security/interfaces/TaintLedger.md#property-untrustedseen)/`sensitiveSeen` flags are never lossy:
they are the load-bearing signal for the lethal-trifecta gate.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `maxTrackedChars?`: `number`; `minSpanLength?`: `number`; \} |
| `opts.maxTrackedChars?` | `number` |
| `opts.minSpanLength?` | `number` |

## Returns

[`TaintLedger`](/api/@graphorin/security/interfaces/TaintLedger.md)

## Stable
