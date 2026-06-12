---
'@graphorin/mcp': minor
---

feat(mcp): tool-definition pinning + list_changed visibility (MC-6)

`toTools()` was a one-shot snapshot with no fingerprinting and no
`tools/list_changed` subscription — the classic MCP approve-then-swap
rug-pull (a server changing a definition behind an approved name between
restarts) was undetectable, and server-side catalogue churn was invisible.

- Every adapted tool is stamped with a stable sha256 `__definitionHash`
  (key-sorted canonical render of name/description/schemas/title);
  `adaptMCPTools` also returns the per-name `fingerprints` map.
- Definition drift between snapshots within one client lifetime is audited
  (`mcp.tools.changed.total` + warn log with both hashes).
- `toTools({ pinnedFingerprints, onPinMismatch })` checks operator pins
  from a previously approved snapshot: `'reject'` throws the new
  `MCPToolPinningError` (`kind: 'pin-mismatch'`); the default `'warn'`
  audits `mcp.tools.pin-mismatch.total` and continues.
- `notifications/tools/list_changed` is now subscribed — each notification
  bumps `mcp.tools.list-changed.total` and logs a warning to re-run
  `toTools()`.
