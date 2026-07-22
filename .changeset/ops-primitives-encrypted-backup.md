---
'@graphorin/store-sqlite-encrypted': minor
'@graphorin/security': minor
'@graphorin/cli': minor
---

Operational primitives for the key-rotation and backup runbooks. `graphorin storage backup` on an encrypted store previously failed with the cryptic driver error "backup is not supported with incompatible source and target databases" (the page-level backup API cannot key either side of the transfer); it is now a consistent stopped-server byte copy - checkpoint, prove no live holder (refusing with a clear live-writer error while the server runs), copy, verify the copy's cipher integrity - via the new `backupEncryptedDatabase` export (`EncryptedBackupLiveWriterError` extends `EncryptSwapLiveWriterError`). Plaintext stores keep the online page-level path. New `graphorin secrets rekey --new-passphrase-from <ref>` re-encrypts the encrypted-file secrets bundle under a new passphrase (fresh KDF salt, values unchanged; exit 2 for sources without a bundle passphrase), backed by `EncryptedFileSecretsStore.rekey()` and a new `secret:rekey` audit action.
