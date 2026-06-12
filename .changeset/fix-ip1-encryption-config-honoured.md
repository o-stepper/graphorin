---
'@graphorin/server': patch
'@graphorin/cli': patch
---

fix(server): the storage-encryption config is honoured — passphrase reaches the store (IP-1)

`graphorin init --encrypted` generated a config nothing respected: the server
built the store with only `{path, mode}` while the resolved
`storagePassphrase` was never consumed, the CLI had the same hole, and a
database encrypted via `graphorin storage encrypt` could not be opened by the
server at all. The encryption health check failed on every encrypted boot
**with the wrong reason** (blaming a missing peer dep).

- `createServer` resolves `storage.encryption.passphraseRef` **before**
  constructing the store and threads `{ enabled, cipher, passphraseResolver }`
  into `createSqliteStore` — failing fast with an actionable error when the
  ref is missing. The CLI `openStoreContext` does the same, so CLI and server
  open the same encrypted database.
- The health check's factual basis is the boot-time keyed open (a server
  serving `/v1/health` with encryption enabled has already proven the peer +
  key); `fail` is reserved for an explicit negative cipher-peer probe instead
  of being the default for every encrypted boot.

Gated real-peer e2e: a config with `encryption` enabled produces a `data.db`
whose keyless `sqlite_master` read throws `file is not a database` —
retro-RED verified (reverting the threading turns the file plaintext and the
test fails).
