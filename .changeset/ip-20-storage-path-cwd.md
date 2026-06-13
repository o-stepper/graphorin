---
'@graphorin/cli': patch
---

Resolve `storage` command paths against the CWD, matching the server (IP-20).

`graphorin storage status` / `storage encrypt` resolved a relative
`storage.path` against the **config-file directory**, while every other CLI
command (`memory …` via `openStoreContext`), the server (`createServer` →
`createSqliteStore`), and the encrypted audit DB resolve it against the
**current working directory**. Run from a directory other than the config
file's, `storage status` therefore inspected a *different* `data.db` than the
server and the rest of the CLI actually used.

The `storage` commands now resolve a relative `storage.path` (and the derived
audit path) against the CWD too, so every command and the server agree on one
database from any working directory. Absolute `storage.path` values are
unaffected. Pin a fixed location with an absolute path if you need
CWD-independence.
