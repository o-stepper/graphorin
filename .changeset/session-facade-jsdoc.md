---
'@graphorin/sessions': patch
---

W-132: `SessionManager.deleteSession` JSDoc now matches the store contract and implementation - the hard-delete cascades into session content (messages/episodes with index rows, the `SESSION_SCOPED_PURGES` registry of session-scoped surfaces, and suspended-run checkpoints); the stale "purge them separately" guidance is gone. Custom `SessionStore` authors are pointed at the full `SessionStoreExt.deleteSession` contract.
