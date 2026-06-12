---
'@graphorin/security': patch
---

fix(security): block process-escape modules + CJS require in the worker sandbox (SDF-9)

The `'worker-threads'` tier blocked `fs` / network imports via an ESM
resolve hook, but `node:child_process`, `node:vm`, `node:cluster`,
`node:inspector` and nested `node:worker_threads` — all process-level
escapes that defeat the tier — were reachable, and the ESM hook never saw
CJS `require()` (e.g. via `createRequire()`).

- Those escape modules are now ALWAYS denied (independent of the
  fs/network flags).
- A `Module._load` interception (installed after the runtime's own setup)
  denies the same specifiers and the fs/network blocklist through CJS
  `require()` too.
- The guide now states plainly that `'worker-threads'` is best-effort
  isolation — not a security boundary — and untrusted code belongs under
  `'isolated-vm'` / `'docker'`.
