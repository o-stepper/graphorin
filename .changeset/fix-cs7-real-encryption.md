---
'@graphorin/store-sqlite-encrypted': patch
'@graphorin/store-sqlite': patch
---

fix(store-sqlite-encrypted): encryption works against the real cipher peer (CS-7 / CS-13)

Verified against the actual `better-sqlite3-multiple-ciphers@12.9.0`: the
entire encrypt/verify/rekey surface only ever worked against the test stub.

- **`encryptDatabase`** used `ATTACH … KEY` + `SELECT sqlcipher_export('enc')` —
  sqlite3mc ships **no such function**, so every real run threw and deleted the
  target. The export is now a supported **checkpoint → byte-copy → in-place
  `PRAGMA rekey`** sequence (the byte-copy trivially preserves rowids, keeping
  FTS5 external-content mappings intact — the CS-10 concern).
- **`cipherIntegrityCheck`** ran `PRAGMA cipher_integrity_check`, which does
  not exist in sqlite3mc (empty row-set → `ok` was always `false`). It now runs
  the standard `PRAGMA integrity_check` through the keyed connection — which
  also kills **`rekeyDatabase`'s false post-rekey failure** (the key rotated
  successfully while the operator was told it had not — operationally
  dangerous).
- **Keyed opens were broken in the store itself**: `openConnection` applied
  only `PRAGMA key`, never the cipher-selection pragmas — and sqlite3mc
  defaults to chacha20, so a SQLCipher-v4 database opened with `key` alone
  read garbage. The cipher pragmas now run **before** `key` on every
  encrypted open.
- **Rekey in WAL**: sqlite3mc refuses `PRAGMA rekey` in WAL journal mode
  (real-peer discovery) — encrypt/rekey drop to `DELETE` for the conversion
  and restore WAL after.
- **CS-13**: `'wxsqlite3'` is the library's name, not a cipher (the peer
  rejects it) — the `EncryptionCipher` union replaces it with `'chacha20'`
  (the peer default, round-trip tested); the package description drops the
  nonexistent `aes256gcm`.
- The native peer joins `pnpm.onlyBuiltDependencies` so its binding actually
  builds, and a **gated real-peer end-to-end test** covers the audit
  acceptance: migrated store with FTS rows → encrypt → keyless open rejected →
  keyed store FTS search works → rekey → old key rejected, new key searches.
  The stub driver is rewritten to real-peer semantics (no `sqlcipher_export`,
  `integrity_check` rows, keyless `rekey` converts plaintext in place).
