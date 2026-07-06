---
'@graphorin/mcp': minor
---

Full TOFU pin lifecycle (W-079). With a `pinStore`, a tool ADDED after the first-use recording is now rejected by default (`MCPToolPinningError`; `onPinMismatch: 'warn'` admits it with the new `mcp.tools.pin-added.total` counter) - previously post-approval additions entered the catalogue unchecked. Removals of pinned tools are observable via `mcp.tools.pin-removed.total` (never an exception - but they can hide a rename). The new `onPinMismatch: 'accept-and-update'` gives operators the documented path to accept a legitimate catalogue change: after the comparison it overwrites the store with the current snapshot (`mcp.tools.pins-updated.total` + log), ending the eternal-warn state without manual store mutation. Explicit `pinnedFingerprints` stay subset-pins and win over the store; servers that legitimately extend their catalogue under a pinStore should use `'warn'` or `'accept-and-update'`.
