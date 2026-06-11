---
'@graphorin/security': patch
---

fix(security): stop EncryptedFileSecretsStore from silently destroying secrets (SPL-3)

`#readOrInitPlaintext` caught **every** read error with a bare `catch` and
returned a fresh empty bundle. A wrong/rotated passphrase, tampered or
truncated file, bad magic, or invalid JSON would therefore be swallowed, and
the next `set()` overwrote the bundle — destroying every previously-stored
secret while the audit log recorded `decision: 'success'`. Three hardenings:

- **Fail-loud:** a fresh bundle is initialised **only** on `ENOENT`. Any
  decrypt / auth-tag / magic / JSON error now propagates, so `set()` /
  `delete()` throw instead of wiping the store. The on-disk bundle is left
  untouched by a failed write.
- **Atomic write:** the bundle is written to `<path>.tmp` (mode `0o600`) then
  `rename`d onto the target, so a crash mid-write can never truncate or
  corrupt an existing bundle.
- **In-process single-writer guard:** concurrent `set`/`delete` on one
  instance are serialised so their read-modify-write cycles cannot interleave.
  Cross-process writers stay out of scope; the atomic rename still rules out
  corruption (worst case last-write-wins).

`documentation/guide/secrets.md` documents the durability/recovery behaviour.
