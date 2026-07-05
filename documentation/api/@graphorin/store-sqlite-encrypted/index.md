[**Graphorin API reference v0.6.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/store-sqlite-encrypted

# @graphorin/store-sqlite-encrypted

> Optional encryption-at-rest sub-pack for the [Graphorin](https://github.com/o-stepper/graphorin)
> framework's default SQLite store. Pulls in
> `better-sqlite3-multiple-ciphers@^12.9.0` (a drop-in fork of `better-sqlite3`
> that bundles the SQLite3MultipleCiphers extension) and exposes the
> encrypt / rekey / integrity-check runners that back the `graphorin storage`
> CLI subcommand group.
>
> Project Graphorin · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.6.0 (optional sub-pack)
- **Default cipher:** `sqlcipher` (SQLCipher v4 compatible, `legacy=4`)
- **Defaults:** encryption-at-rest is **OFF by default**. Opt in through
  `graphorin init --encrypted`.
- **`audit.db`:** ALWAYS encrypted regardless of this opt-in. Installing
  this sub-pack is the only supported way to satisfy that requirement on
  fresh installations.

---

## Install

```bash
pnpm add @graphorin/store-sqlite-encrypted
# Pulls in better-sqlite3-multiple-ciphers@^12.9.0 as a peer dep.
```

The cipher peer ships prebuilt binaries for every Node 22+ target
(macOS arm64/x64, Linux x64/arm/arm64 with both glibc and musl, Windows
x86/x64/arm64) so there is no compile step on `pnpm install` for the
default platforms.

If you are on a platform without a prebuilt binary you will need a C++
toolchain and Python 3 available; consult the upstream
[`better-sqlite3-multiple-ciphers`](https://www.npmjs.com/package/better-sqlite3-multiple-ciphers)
README for details.

---

## Usage

### One-shot encryption migration (CLI flow)

```bash
# 1. Stop any running graphorin server / writers.
graphorin stop

# 2. Back up the unencrypted DB.
cp ~/.graphorin/data.db ~/.graphorin/data.db.backup-$(date +%Y%m%d-%H%M)

# 3. Encrypt + verify (passphrase resolved from a SecretRef chain).
graphorin storage encrypt --passphrase-from keyring:graphorin_db_passphrase

# 4. Update the config and restart.
graphorin config set storage.encryption.enabled true
graphorin config set storage.encryption.passphraseRef keyring:graphorin_db_passphrase
graphorin start

# 5. After a verification window (default 7 days) drop the backup.
graphorin storage cleanup-backups --older-than 7d
```

### Programmatic use

```ts
import {
  createEncryptedConnection,
  encryptDatabase,
  rekeyDatabase,
  cipherIntegrityCheck,
} from '@graphorin/store-sqlite-encrypted';

// Open an existing encrypted DB.
const conn = await createEncryptedConnection({
  path: '/var/lib/graphorin/data.db',
  encryption: {
    enabled: true,
    passphraseResolver: async () => process.env.GRAPHORIN_DB_PASSPHRASE!,
  },
});

// Verify the cipher header on startup or via a triggers cron.
const integrity = cipherIntegrityCheck(conn);
if (!integrity.ok) {
  throw new Error(`cipher_integrity_check failed: ${integrity.rows.join('; ')}`);
}

// One-shot migration of an unencrypted file into a new encrypted one.
await encryptDatabase({
  sourcePath: '/var/lib/graphorin/data.db',
  targetPath: '/var/lib/graphorin/data.db.encrypted',
  passphrase: process.env.GRAPHORIN_DB_PASSPHRASE!,
  swap: true, // atomic rename + .bak.<timestamp> kept for recovery
});

// Rotate the passphrase in place (PRAGMA rekey under the hood).
await rekeyDatabase({
  path: '/var/lib/graphorin/data.db',
  oldPassphrase: process.env.OLD_PASSPHRASE!,
  newPassphrase: process.env.NEW_PASSPHRASE!,
});
```

---

## Cipher selection

The default cipher is `'sqlcipher'` with the `legacy=4` parameter set -
SQLCipher v4 compatible - chosen for ecosystem tooling compatibility
(DB Browser for SQLCipher, `sqlcipher` CLI, GUI inspectors). Other
cipher modes shipped by the cipher peer are accepted; pass them via the
`cipher` option:

| Cipher        | Notes                                                                       |
|---------------|-----------------------------------------------------------------------------|
| `'sqlcipher'` | Default. AES-256-CBC + HMAC-SHA1 + Argon2id KDF. SQLCipher v4 compatible.   |
| `'chacha20'`  | The cipher peer's own default (ChaCha20-Poly1305).                          |
| `'aes256cbc'` | Raw AES-256-CBC without the SQLCipher HMAC envelope.                        |
| `'aes128cbc'` | AES-128-CBC variant.                                                        |
| `'rc4'`       | Legacy interop only. Do **not** use for new deployments.                    |

---

## Operational notes

- **Passphrase loss = total data loss.** The cipher peer cannot
  recover an encrypted DB without the passphrase. Store the passphrase
  in a keyring or vault (the `graphorin storage encrypt` CLI prompts
  for this).
- **WAL housekeeping bytes** are visible to an attacker on file leak
  (page numbers, lengths). Row contents are not. See ADR-030 § 5
  for the threat-model nuance.
- **Performance overhead** is typically 5-15 % on OLTP workloads (read
  / write of small rows). The triggers cron that runs the daily
  `cipher_integrity_check` is a read-only pragma so it does not
  block writers.
- **Edge runtimes** (Cloudflare Workers, Vercel Edge) are **not
  supported**. The cipher peer is a native addon. For edge deployments
  use `@graphorin/store-libsql` (Turso encryption is a separate story).

---

## Related decisions

- ADR-030 - SQLite encryption at rest (SQLCipher v4 baseline + KDF parameters).
- ADR-008 - Storage default `better-sqlite3` (synchronous embedded SQLite + WAL hardening).

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/store-sqlite-encrypted - optional encryption-at-rest
sub-pack for the Graphorin framework's default SQLite store.

Installing this package pulls in the cipher peer driver
(`better-sqlite3-multiple-ciphers@^12.9.0`), which is a drop-in fork
of `better-sqlite3` that bundles the SQLite3MultipleCiphers
extension (SQLCipher v4 / wxSQLite3 / AES-256-CBC / AES-128-CBC /
RC4 cipher modes).

The package exposes:

 - [createEncryptedConnection](/api/@graphorin/store-sqlite-encrypted/functions/createEncryptedConnection.md) - convenience wrapper around
   `openConnection` from `@graphorin/store-sqlite/connection` that
   pre-loads the cipher peer.
 - [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) - converts an unencrypted SQLite file
   into an encrypted one. Backs `graphorin storage encrypt`.
 - [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md) - re-keys an already encrypted file. Backs
   `graphorin storage rekey`.
 - [cipherIntegrityCheck](/api/@graphorin/store-sqlite-encrypted/functions/cipherIntegrityCheck.md) - runs `PRAGMA cipher_integrity_
   check`. Used by the triggers daemon's daily verification cron
   and the `/v1/health/storage` endpoint.
 - [DEFAULT\_CIPHER](/api/@graphorin/store-sqlite-encrypted/variables/DEFAULT_CIPHER.md), [pragmaSequenceForCipher](/api/@graphorin/store-sqlite-encrypted/functions/pragmaSequenceForCipher.md),
   [encodePassphraseForPragma](/api/@graphorin/store-sqlite-encrypted/functions/encodePassphraseForPragma.md) - cipher-config helpers shared
   by the runners and consumable for advanced setups.
 - [loadCipherPeer](/api/@graphorin/store-sqlite-encrypted/functions/loadCipherPeer.md) / [EncryptedStorePeerMissingError](/api/@graphorin/store-sqlite-encrypted/classes/EncryptedStorePeerMissingError.md) -
   explicit peer-loader surface for callers that want to fail-fast
   at startup before opening the DB.

Defaults follow ADR-030 / DEC-129:
 - Cipher: `'sqlcipher'` (SQLCipher v4 compatible, `legacy=4`).
 - Default OFF; opt-in through `graphorin init --encrypted`.
 - audit.db is ALWAYS encrypted regardless of this opt-in
   (DEC-124); this package satisfies that requirement too.

## Classes

| Class | Description |
| ------ | ------ |
| [EncryptedStorePeerMissingError](/api/@graphorin/store-sqlite-encrypted/classes/EncryptedStorePeerMissingError.md) | Raised when the cipher peer driver cannot be loaded. Distinct from the matching `CipherPeerMissingError` in `@graphorin/store-sqlite/ encryption` so consumers can catch the two layers independently. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CipherIntegrityCheckResult](/api/@graphorin/store-sqlite-encrypted/interfaces/CipherIntegrityCheckResult.md) | Result of [cipherIntegrityCheck](/api/@graphorin/store-sqlite-encrypted/functions/cipherIntegrityCheck.md). |
| [EncryptDatabaseOptions](/api/@graphorin/store-sqlite-encrypted/interfaces/EncryptDatabaseOptions.md) | Options for [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md). |
| [EncryptDatabaseResult](/api/@graphorin/store-sqlite-encrypted/interfaces/EncryptDatabaseResult.md) | Result of a successful [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) run. |
| [RekeyDatabaseOptions](/api/@graphorin/store-sqlite-encrypted/interfaces/RekeyDatabaseOptions.md) | Options for [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md). |
| [RekeyDatabaseResult](/api/@graphorin/store-sqlite-encrypted/interfaces/RekeyDatabaseResult.md) | Result of a successful [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md) run. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [EncryptionCipher](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | Cipher selection, validated against the real sqlite3mc vocabulary (CS-13 - `'wxsqlite3'` is the library's name, not a cipher; the peer rejects it with "Cipher 'wxsqlite3' unknown"). `'sqlcipher'` is the Graphorin default (SQLCipher v4 compatible); `'chacha20'` is the peer's own default cipher. |

## Variables

| Variable | Description |
| ------ | ------ |
| [DEFAULT\_CIPHER](/api/@graphorin/store-sqlite-encrypted/variables/DEFAULT_CIPHER.md) | Default cipher. Matches ADR-030 § 2 - SQLCipher v4 compatible (AES-256-CBC + HMAC-SHA1, `legacy=4` parameter set). |
| [VERSION](/api/@graphorin/store-sqlite-encrypted/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetCipherPeerCacheForTesting](/api/@graphorin/store-sqlite-encrypted/functions/resetCipherPeerCacheForTesting.md) | Test-only escape hatch. Drops the cached constructor so the next [loadCipherPeer](/api/@graphorin/store-sqlite-encrypted/functions/loadCipherPeer.md) call re-imports the peer. |
| [\_setCipherPeerForTesting](/api/@graphorin/store-sqlite-encrypted/functions/setCipherPeerForTesting.md) | Test-only escape hatch. Pre-populates the cache with a stub driver so unit tests can exercise the encrypt / rekey runners without touching the native cipher addon. |
| [cipherIntegrityCheck](/api/@graphorin/store-sqlite-encrypted/functions/cipherIntegrityCheck.md) | Runs `PRAGMA integrity_check` against the provided connection. The connection MUST already be open with the cipher key applied (typically via [createEncryptedConnection](/api/@graphorin/store-sqlite-encrypted/functions/createEncryptedConnection.md)) - a wrong key surfaces as an open/read error before the pragma runs. |
| [createEncryptedConnection](/api/@graphorin/store-sqlite-encrypted/functions/createEncryptedConnection.md) | Opens an encrypted SQLite connection. Differs from `openConnection` only in that the cipher peer driver is preloaded - callers that supply an `encryption.passphraseResolver` get the same behaviour as `openConnection({ encryption })` plus an explicit fail-fast on a missing cipher peer. |
| [encodePassphraseForPragma](/api/@graphorin/store-sqlite-encrypted/functions/encodePassphraseForPragma.md) | SQL-literal-encodes a passphrase for use as the right-hand side of `PRAGMA key = ...`. |
| [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) | Encrypts an unencrypted SQLite database. Returns once the target file has been written and verified. Throws if the source is missing, the target already exists (and `overwriteTarget` is unset), the cipher peer is missing, or the integrity check fails. |
| [loadCipherPeer](/api/@graphorin/store-sqlite-encrypted/functions/loadCipherPeer.md) | Loads `better-sqlite3-multiple-ciphers`. The result is cached for the lifetime of the process so repeat callers (encrypt + rekey + connection-open in the same process) share one native handle. |
| [pragmaSequenceForCipher](/api/@graphorin/store-sqlite-encrypted/functions/pragmaSequenceForCipher.md) | Returns the PRAGMA statements that select a cipher. The list is applied **before** `PRAGMA key = ...` so the cipher peer knows which KDF / mode to use when interpreting the key bytes. |
| [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md) | Re-keys an encrypted SQLite database. Throws if the file is missing, the cipher peer cannot be loaded, the old passphrase is wrong (the cipher peer raises `SQLITE_NOTADB` on the first read), or the post-rekey integrity check fails. |
