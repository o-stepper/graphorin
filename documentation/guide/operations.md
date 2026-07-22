# Operations runbooks

Step-by-step procedures for operating a standalone Graphorin server:
backup, restore, upgrade, rollback and key rotation. Each runbook uses
only shipped commands, states its preconditions, and says what proves
it in CI. Scope: a **single-node** server (the supported deployment
shape today - see [Road to 1.0](/guide/stability#road-to-1-0) for what
HA/scale-out evidence is still owed).

The [Storage](/guide/storage) page carries the command safety matrix
(read-only vs write-lock-contending vs requires-a-stopped-server);
this page assumes it.

## What is on disk

| Artifact | Default location | Notes |
|---|---|---|
| Main database | `storage.path` (`./.graphorin/data.db`; `/data/data.db` in the container) | Plus WAL sidecars `data.db-wal` / `data.db-shm` while a writer is up. Holds memory, sessions, checkpoints, triggers, **auth tokens**, idempotency state. |
| Audit log | `audit.path` (defaults to `audit.db` next to the main DB) | Always encrypted, separate hash chain. |
| Secrets | keyring, or the encrypted-file bundle (`~/.graphorin/secrets.enc` / mounted files) | The bundle is AES-256-GCM at rest - safe to copy as a file. |
| Config | `--config` path (`/etc/graphorin/config.json` in the container) | Plain file; keep it in your config management, not in backups of the data dir. |

## Backup

`graphorin storage backup` has two honest modes, selected by the
config's `storage.encryption.enabled`:

- **Plaintext store**: an online, page-level backup - safe under a
  live writer (the server keeps running) and preserves rowids so the
  FTS5 mapping survives.
- **Encrypted store**: a consistent **stopped-server byte copy**. The
  cipher driver cannot key either side of an online page-level
  transfer, so the command checkpoints the WAL, proves no other holder
  is live (refusing with a live-writer error otherwise), byte-copies
  the file and verifies the copy's cipher integrity. The copy stays
  encrypted with the same key.

Either way it is the only supported backup - never use `VACUUM INTO`
(it renumbers rowids and corrupts the FTS mapping on restore).

```bash
# Plaintext store - run on a schedule, the server may stay up.
# Encrypted store - run in the maintenance window with the server stopped.
graphorin storage backup /backups/data-$(date +%F).db --config /etc/graphorin/config.json

# Retention for the backups the server knows about:
graphorin storage cleanup-backups --config /etc/graphorin/config.json

# Reclaim free pages periodically (write-lock-contending, prefer quiet hours):
graphorin storage compact --config /etc/graphorin/config.json
```

The audit log is a separate database with its own passphrase. Two
supported options:

```bash
# Online, append-friendly archival (JSONL, resumable by sequence):
graphorin audit export --to /backups/audit-$(date +%F).jsonl --config /etc/graphorin/config.json
```

or a plain file copy of `audit.db` **while the server is stopped**.
For the secrets bundle, a plain file copy is enough - it is encrypted
at rest.

Treat `data.db` + `audit.db` + the secrets bundle as **one backup
set**: restoring them from different points in time works, but
audit references and token state may skew across the gap.

## Restore

Preconditions: a backup file produced by `storage backup`; the server
**stopped**.

1. Stop the server.
2. Move the damaged database AND its sidecars out of the way:
   `data.db`, `data.db-wal`, `data.db-shm` (stale sidecars from a
   different database generation must not be replayed into the
   restored file).
3. Copy the backup into place as `storage.path` and restore tight
   permissions: `chmod 0600 data.db`.
4. Start the server. Migrations are idempotent and checksummed - a
   backup taken on an older patch/minor upgrades itself on boot.
5. Verify: `/v1/health` answers `ok`, and
   `graphorin doctor --all --config ...` is clean.

Caveats:

- **Backups are point-in-time.** Erasure/deletion requests honored
  after the backup was taken must be **repeated** after a restore.
- Raw auth tokens minted after the backup point no longer verify
  (their hashes are not in the restored DB); tokens minted before it
  work again. `graphorin token list` shows what the restored state
  believes.
- A fresh `audit.db` starts a new chain if you do not restore the old
  one alongside; the old chain stays independently verifiable from its
  own backup.

The weekly Docker smoke workflow runs this drill end-to-end: boots the
shipped image (encrypted store), mints a token, stops the server,
takes the stopped-server backup, destroys the container AND the data
volume, restores the backup into a fresh volume, reboots, and asserts
the token survived.

## Upgrade

Graphorin releases are [lockstep](/guide/stability#versioning-model):
upgrade every `@graphorin/*` package to the same version at once.

1. Read the target version's section in
   [Migration (pre-1.0)](/guide/migration) - pre-1.0 minors may carry
   breaking changes; patches never do.
2. **Take a backup first** (see above). The schema is forward-only, so
   this backup IS your rollback path.
3. Install the new lockstep set (pin exact versions in your
   manifest/lockfile; for the container image, rebuild from the new
   tag).
4. Apply migrations offline: `graphorin migrate --config ...` on the
   stopped server, or let the server migrate itself on first boot -
   both run the same atomic, idempotent runner. Read-only CLI
   commands against a newer-schema database refuse rather than
   auto-upgrade, so a half-rolled fleet fails loud, not quiet.
5. Start, then verify `/v1/health` and `graphorin doctor --all`.

## Rollback

There is deliberately **no schema downgrade**. Rolling back a release:

1. Stop the server.
2. Reinstall the previous lockstep version set.
3. Restore the pre-upgrade backup (runbook above) - this is why step 2
   of Upgrade is not optional.
4. Start and verify.

Data written between the upgrade and the rollback lives only in the
rolled-back-from database; session exports taken from it remain
readable by the older release within the
[N-2 export compatibility band](/guide/stability#artifact-compatibility).

## Key rotation

Four distinct keys, four runbooks - they do not substitute for each
other:

### Database passphrase (encrypted store)

```bash
# Requires a stopped server; passphrases travel as SecretRef URIs, never argv:
graphorin storage rekey \
  --old-passphrase-from file:/run/secrets/graphorin/db-passphrase \
  --new-passphrase-from file:/run/secrets/graphorin/db-passphrase-next \
  --config /etc/graphorin/config.json
```

Then update the config's `storage.encryption.passphraseRef` source to
serve the new value and start the server. The rekey verifies cipher
integrity before reporting success.

### Server pepper (token hashing)

Only token **hashes** are stored, keyed by the pepper - a new pepper
invalidates every existing token, and nothing can re-hash them. The
order matters:

```bash
# 1. Write the new pepper into the secrets source the config points at
#    (auth.pepperRef), e.g.:
openssl rand -hex 32 | graphorin secrets set graphorin_server_pepper --from-stdin

# 2. Re-issue every active token under the new pepper:
graphorin token rekey --config /etc/graphorin/config.json

# 3. Redistribute the freshly printed raw tokens to clients.
```

A live server's verifier cache honors old tokens for up to ~60 s after
rotation - plan the redistribution window accordingly.

### Secrets bundle passphrase (encrypted-file store)

```bash
# Re-encrypts the whole bundle (fresh KDF salt), values unchanged:
GRAPHORIN_MASTER_PASSPHRASE='<current>' graphorin secrets rekey \
  --secrets-source encrypted-file \
  --new-passphrase-from env:GRAPHORIN_NEW_MASTER_PASSPHRASE
```

Afterwards start supplying the new value as
`GRAPHORIN_MASTER_PASSPHRASE`. Sources without a bundle passphrase
(keyring, env, memory) answer exit code `2` (unsupported).

### Individual secret values

```bash
graphorin secrets rotate <key> --from-stdin
```

Same store write as `set`, surfaced separately so audit logs
distinguish a rotation from an initial write. Rotate the deployment
pepper and provider API keys on your normal credential schedule.

## What CI proves

- **Weekly Docker smoke**: image build, boot with the shipped config
  (encrypted store + token auth), online backup, full
  destroy-and-restore drill, health + token survival - plus an image
  vulnerability gate on fixable high/critical findings.
- **Package test suites**: online backup mode/permissions, encrypt +
  rekey + swap live-writer guards, token rekey semantics, secrets
  bundle rekey round-trip (old passphrase must fail afterwards),
  migration idempotence + checksum tamper refusal, export
  schema-band enforcement, multi-process checkpoint durability.

## Not covered yet

Horizontal scaling, HA topologies, rolling upgrades across replicas,
and load/soak envelopes are not yet documented or proven - they are
the operational tail tracked on the
[road to 1.0](/guide/stability#road-to-1-0). Until then, size a single
node with [Performance & scale](/guide/performance) and treat the
restore runbook as the availability story.
