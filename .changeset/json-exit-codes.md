---
'@graphorin/cli': patch
---

W-002: exit codes are honored in `--json` mode. Eight commands set `process.exitCode` inside the `human()` callback of `emitReport`, which `--json` skips entirely - so exactly the machine consumers the flag exists for saw exit 0 on failure, worst of all `graphorin audit verify --json` returning 0 on a broken hash chain. The assignments are hoisted outside the callback (matching the existing doctor/tools-lint pattern) for: `audit verify`, `secrets get`, `secrets ref`, `token revoke`, `token verify`, `pricing lookup`, `skills inspect`, `triggers status`. `emitReport`'s doc now forbids side effects in `human()`. CI pipelines that (incorrectly) relied on exit 0 under `--json` on failure will now see the documented exit 1.
