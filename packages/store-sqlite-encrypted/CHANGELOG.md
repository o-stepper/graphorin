# @graphorin/store-sqlite-encrypted

## 0.1.0

### Minor Changes

- Initial release of the optional encryption-at-rest sub-pack for the Graphorin
  framework's default SQLite store. Pulls in
  `better-sqlite3-multiple-ciphers@^12.9.0` and exposes the `encryptDatabase`,
  `rekeyDatabase`, `cipherIntegrityCheck`, and `createEncryptedConnection`
  helpers consumed by the `graphorin storage` CLI.
