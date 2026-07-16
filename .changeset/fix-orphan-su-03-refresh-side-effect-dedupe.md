---
'@graphorin/security': patch
---

Dedupe concurrent OAuth `refresh()` side effects onto a single cycle (e2e 2026-07-16, ORPHAN-SU-03). The HTTP layer already coalesced concurrent refreshes into one token-endpoint round-trip (SPL-12), but every joining caller then re-ran the client-level tail on the shared result - so one actual rotation emitted one `oauth:refreshed` audit row, one `oauth.refreshed` lifecycle event, and one rotation strategy hook PER CALLER, and audit consumers counted a single rotation N times. `createOAuthClient().refresh()` now shares one full cycle (network + persist + audit + lifecycle + hooks) across concurrent callers, honoring the documented "reuses the in-flight refresh promise" contract end to end; a `force: true` refresh bypasses the join and installs itself as the shared promise, exactly like the HTTP-level dedupe. Regression tests pin one-cycle side effects for three concurrent callers, slot reset after settlement, and the forced-bypass path.
