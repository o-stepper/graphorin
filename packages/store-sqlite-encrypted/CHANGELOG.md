# @graphorin/store-sqlite-encrypted

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the optional encryption-at-rest sub-pack for the Graphorin
  framework's default SQLite store. Pulls in
  `better-sqlite3-multiple-ciphers@^12.9.0` and exposes the `encryptDatabase`,
  `rekeyDatabase`, `cipherIntegrityCheck`, and `createEncryptedConnection`
  helpers consumed by the `graphorin storage` CLI.
