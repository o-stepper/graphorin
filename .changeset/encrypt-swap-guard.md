---
'@graphorin/store-sqlite-encrypted': minor
'@graphorin/cli': patch
---

W-012: `encryptDatabase({ swap: true })` now probes for a live writer BEFORE touching the source and refuses with the new typed `EncryptSwapLiveWriterError` when another connection holds the database. The swap path renames the source file; a running server would keep writing into the renamed `.bak.<ts>` inode, silently diverging from the encrypted copy until `storage cleanup-backups` deletes those writes. The probe (a journal-mode switch, which sqlite3mc refuses with "database is locked" under any other open connection) restores WAL in `finally`; the probe-to-rename window remains a documented best-effort residual. CLI `--swap` help and the storage guide now state the stopped-server requirement.
