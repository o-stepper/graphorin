---
'@graphorin/store-sqlite': patch
'@graphorin/core': patch
---

Session hard-delete and the RP-6 retention sweep now purge the session's CONTENT (store-01): `session_messages` rows plus their FTS and per-embedder vector index entries, and episodes scoped to the session, all inside the existing cascade transaction. Previously no code path anywhere deleted `session_messages`, so a "deleted" conversation stayed permanently searchable via `memory.session.list/search` - a GDPR hazard for a privacy-positioned framework. The core `SessionStoreExt.deleteSession` contract is updated to document the content cascade.
