---
'@graphorin/security': patch
'@graphorin/tools': patch
'@graphorin/core': patch
---

fix(security): stop sandbox workers from inheriting the host process.env (TL-9)

Both `node:worker_threads` constructors — `runBridgedSource` (the code-mode
primitive that executes model-written scripts) and `createWorkerThreadsSandbox`
(the default isolation tier) — spawned workers without the `env` option, so
each worker inherited a full copy of the host `process.env`. A model-written
`code_execute` script could exfiltrate host API keys and credentials with
`return process.env` (or pass them to a bridged tool). Workers are now
constructed with `env: {}`, and both inline runtimes additionally scrub
`process.env` down to the explicit `SandboxRunOptions.env` allowlist before
user code runs (defence in depth). The model-facing `code_execute` description
no longer overstates the isolation as absolute and now states that host
environment variables are unavailable. `SandboxRunOptions.env` is documented
as an allowlist: entries given there are the only variables defined inside
the sandbox.
