# @graphorin/store-sqlite-encrypted

> Optional encryption-at-rest sub-pack for the [Graphorin](https://github.com/o-stepper/graphorin)
> framework's default SQLite store. Pulls in
> `better-sqlite3-multiple-ciphers@^12.9.0` (a drop-in fork of `better-sqlite3`
> that bundles the SQLite3MultipleCiphers extension) and exposes the
> encrypt / rekey / integrity-check runners that back the `graphorin storage`
> CLI subcommand group.
>
> Project Graphorin · v0.2.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.2.0 (optional sub-pack)
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

The default cipher is `'sqlcipher'` with the `legacy=4` parameter set —
SQLCipher v4 compatible — chosen for ecosystem tooling compatibility
(DB Browser for SQLCipher, `sqlcipher` CLI, GUI inspectors). Other
cipher modes shipped by the cipher peer are accepted; pass them via the
`cipher` option:

| Cipher        | Notes                                                                       |
|---------------|-----------------------------------------------------------------------------|
| `'sqlcipher'` | Default. AES-256-CBC + HMAC-SHA1 + Argon2id KDF. SQLCipher v4 compatible.   |
| `'wxsqlite3'` | Legacy mode used by older wxSQLite3 deployments.                            |
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
- **Performance overhead** is typically 5–15 % on OLTP workloads (read
  / write of small rows). The triggers cron that runs the daily
  `cipher_integrity_check` is a read-only pragma so it does not
  block writers.
- **Edge runtimes** (Cloudflare Workers, Vercel Edge) are **not
  supported**. The cipher peer is a native addon. For edge deployments
  use `@graphorin/store-libsql` (Turso encryption is a separate story).

---

## Related decisions

- ADR-030 — SQLite encryption at rest (SQLCipher v4 baseline + KDF parameters).
- ADR-008 — Storage default `better-sqlite3` (synchronous embedded SQLite + WAL hardening).

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.2.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
