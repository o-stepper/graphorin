---
'@graphorin/cli': patch
---

Fix `graphorin storage cleanup-backups` being a silent no-op on Windows (audit 2026-07-04 Wave E, cluster E6): the DB base name was derived via `dbPath.split('/')`, which on backslash-separated Windows paths returned the whole path so no directory entry ever matched. Now uses `node:path` `basename`/`join`. Also documents the supported-platforms matrix (the one genuine ARM gap: `sqlite-vec` ships no `windows-arm64` binary, so vector search is unavailable on Windows-on-ARM while FTS recall keeps working).
