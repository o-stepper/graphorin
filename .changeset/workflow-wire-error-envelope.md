---
'@graphorin/server': patch
---

Machine-readable workflow failure codes on the wire (W-052): the `workflow.error` WS frame payload and the run-status `error` object now carry `code` (and `hint` when the source error has one) next to the unchanged `message`. Normalization happens at the server boundary via the new internal `toWireError` helper - `err.code` (agent/workflow error family) wins, `err.kind` (tools/memory/provider/server family) is the fallback, `'unknown'` otherwise - so clients can retry `checkpoint-version-conflict` and abandon `node-execution-failed` without parsing English text. No package-internal discriminators were renamed; the field is additive.
