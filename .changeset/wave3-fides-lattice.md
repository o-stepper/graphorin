---
'@graphorin/security': minor
'@graphorin/agent': patch
---

FIDES-lattice: let PII content arm the data-flow policy's lethal-trifecta "private data" leg (SDF-8). Previously only `sensitivity: 'secret'`-tagged tools counted toward `sensitiveSeen`, leaving PII/user-content exfiltration invisible to the trifecta gate.

- `@graphorin/security`: NEW pure `containsPii(text, patterns?)` predicate over the PII catalogue (honours per-pattern validators, e.g. Luhn). `createTaintLedger` gains an opt-in `piiSensitivity` seam — when provided, a tool output it flags arms `sensitiveSeen` even without a `'secret'` tag. `DataFlowPolicyConfig` gains `treatPiiAsSensitive?: boolean`.
- `@graphorin/agent`: `buildDataFlowGuard` wires `containsPii` into the run ledger when `treatPiiAsSensitive` is set on `createAgent({ dataFlowPolicy })`.

Default off ⇒ byte-identical. Composes with `sensitiveTiers`.
