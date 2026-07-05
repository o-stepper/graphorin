---
'@graphorin/store-sqlite': minor
'@graphorin/server': minor
---

W-110: both audit.db open paths now apply the CS-7 cipher-selection pragmas before `PRAGMA key`, so `config.audit.cipher` actually selects the cipher (it was silently ignored - every audit.db came out as the sqlite3mc default, and tools opening it with the declared `sqlcipher` failed with SQLITE_NOTADB). The audit default is pinned to `chacha20` (NOT the main store's `sqlcipher`): pre-fix audit files were created without cipher pragmas, i.e. in chacha20 format, so the pin stays byte-compatible with every existing file. Unknown cipher values fail fast. UPGRADE NOTE: a deployment whose config has long carried `audit.cipher: 'sqlcipher'` (previously ignored) will now fail to open its existing chacha20 file - remove the setting or re-encrypt the audit database. `cipherSelectionPragmas` is now exported from `@graphorin/store-sqlite`.
