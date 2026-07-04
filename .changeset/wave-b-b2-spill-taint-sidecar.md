---
'@graphorin/tools': patch
'@graphorin/agent': patch
---

Spill-handle producer taint now survives executor and process boundaries (audit 2026-07-04 Wave B, cluster B2; tools-03 / security-02 / agent-08).

- The default spill writer persists a `<file>.meta.json` sidecar (mode 0600) recording `{producerTrustClass, source, sensitivity}` next to every artifact; `createFileResultReader` recovers it and reports the producer class (plus source/sensitivity) on the read outcome. An untrusted spill produced in one executor (code-mode's quiet executor) or a prior process can no longer launder to trusted through the `read_result` built-in: the executor re-applies the producer's sanitization policy and records dataflow provenance under the producer's class.
- Producer taint is resolved BEFORE truncation, so a re-spill of a handle read persists the original producer's taint into the new artifact's sidecar, and a secret-produced body keeps its secret tier through re-spill (stays off disk).
- The agent snapshots the coarse taint summary and the promoted-tool set on EVERY exit through the run finalizer, not just the approval suspend: aborted runs (resumable) and completed runs (re-entered as follow-ups) now rehydrate the enforce-mode sink gate and the discovered-tool catalogue.
