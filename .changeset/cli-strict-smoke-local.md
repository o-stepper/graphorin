---
'@graphorin/cli': patch
---

Twelfth external deep retest, P2: new `graphorin doctor --strict-smoke-local` flag (implies `--smoke-local`) for pipelines. Interactively, an unreachable Ollama daemon or a missing model degrades to `warn`/`skip` and exits 0; under strict mode every `smoke:*` check must come back `ok`, so a provisioned-but-broken local stack fails the job instead of shrugging. The scheduled real-integration workflow now runs the strict flag against a live daemon.
