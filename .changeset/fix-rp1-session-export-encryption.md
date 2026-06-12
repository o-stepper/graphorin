---
'@graphorin/sessions': minor
---

fix(sessions): actually encrypt the session export body (RP-1)

`session.export({ encrypt })` consumed the option exactly once — to stamp
`cipher: aes256gcm` on the footer — while `writeRecord` wrote plaintext and
`readSessionExport` never read its `decryptionKey`. The result was a false
security contract on a `@stable` API: a file labelled encrypted with an ignored
key.

- The writer now AES-256-GCM-encrypts each body record (via the existing
  `encryptBody`), emitting a self-identifying `{"enc":"<base64>"}` line; the
  meta header + footer stay plaintext so importers fail fast. The key is the
  pre-derived `key` or `passphrase` + `salt` (via `deriveSessionExportKey`),
  resolved lazily.
- `readSessionExport` decrypts `enc` lines with `decryptionKey`, and throws
  `SessionExportEncryptionRequiredError` when an encrypted line is met without a
  key. The body checksum covers the on-disk (encrypted) bytes.
- The tool-cassette writer had a `cipher` option but no key/encryption pipeline,
  so it could only stamp a label it couldn't honour — that dead option and its
  footer stamp are removed (the footer type keeps `cipher?` readable).
- `documentation/guide/sessions.md` documents the working `encrypt` option.

Red-first: an e2e test writes with `encrypt`, asserts the secret content is not
present as plaintext + the footer stamps the cipher, reads it back with the key,
and asserts a keyless read throws the typed error; a second asserts a plain
export stamps no `cipher`; a cassette test asserts its footer never carries one.
