[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintFlowKind

# Type Alias: TaintFlowKind

```ts
type TaintFlowKind = "untrusted-to-sink" | "lethal-trifecta" | "derived-untrusted-to-sink";
```

Defined in: [packages/security/src/dataflow/types.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L60)

The kind of tainted data flow the policy detected at a sink.

- `'untrusted-to-sink'` - untrusted content (or a verbatim chunk of it)
  is being passed *into* the sink's arguments. The precise, low
  false-positive signal: direct exfiltration of untrusted content.
- `'lethal-trifecta'`   - the conservative signal: a sink fires while
  both untrusted content **and** secret-tier data have entered the run,
  even when no verbatim carry is provable. Catches the paraphrased
  "untrusted instruction drives a secret exfiltration" case at the cost
  of more false positives (hence shadow-mode-first + declassification).
- `'derived-untrusted-to-sink'` (C6, `derivedTaint: 'strict'`) - the
  CaMeL-style control-flow-integrity signal: once untrusted content has
  entered the run, EVERY subsequent model-driven sink call is treated
  as derived from it - paraphrase-robust by construction, deliberately
  coarse. Fires only when the verbatim probe did not already match
  (verbatim keeps the precise label).

## Stable
