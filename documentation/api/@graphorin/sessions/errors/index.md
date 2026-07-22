[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / errors

# errors

Typed error surface for `@graphorin/sessions`.

Every error class extends the base [SessionError](/api/@graphorin/sessions/errors/classes/SessionError.md) which is a
thin wrapper around `Error` with a stable `code` discriminator so
callers can `switch` on it without parsing messages.

## Classes

| Class | Description |
| ------ | ------ |
| [AgentNotFoundError](/api/@graphorin/sessions/errors/classes/AgentNotFoundError.md) | Thrown when an `AgentRegistry.delete(...)` / `retire(...)` is called for an unknown id and the caller passed `{ assertExists: true }`. |
| [CassetteArtifactMissingError](/api/@graphorin/sessions/errors/classes/CassetteArtifactMissingError.md) | Thrown when a cassette's `contentPartsRefs` resolution fails AND `onMissingArtifact: 'abort'` is configured (the default). |
| [CassetteCursorViolationError](/api/@graphorin/sessions/errors/classes/CassetteCursorViolationError.md) | Thrown when the cassette cursor is not monotonically advancing (`stepNumber` ascending; `toolCallId` tiebreak). Indicates a corrupted or maliciously crafted cassette. |
| [CassetteFormatInvalidError](/api/@graphorin/sessions/errors/classes/CassetteFormatInvalidError.md) | Thrown when the cassette JSONL stream does not begin with a `kind: 'meta'` sentinel header carrying `format: 'graphorin-tool-cassette'`. |
| [CassetteIdempotencyMismatchError](/api/@graphorin/sessions/errors/classes/CassetteIdempotencyMismatchError.md) | Thrown when a cassette record's `sha256OfArgs` does not match the live invocation's argument hash AND `failOnIdempotencyMismatch: true` is configured. Default behaviour is to continue with the recorded result and surface the divergence in the event stream. |
| [CassetteSchemaMismatchError](/api/@graphorin/sessions/errors/classes/CassetteSchemaMismatchError.md) | Thrown when a cassette's recorded `output` no longer validates against the tool's `outputSchema` AND `failOnSchemaMismatch: true` is configured (the default). |
| [ReplayAccessDeniedError](/api/@graphorin/sessions/errors/classes/ReplayAccessDeniedError.md) | Thrown by `Session.replay({ raw: true })` when the calling context's scope set does not include `traces:read:raw`. |
| [SessionClosedError](/api/@graphorin/sessions/errors/classes/SessionClosedError.md) | Thrown by `Session.push(...)` when the session has been closed. `close()` is a real lifecycle boundary, not advisory - reopen the session (a fresh `create`) or write to a different one. |
| [SessionError](/api/@graphorin/sessions/errors/classes/SessionError.md) | Base class for every error thrown from `@graphorin/sessions`. |
| [SessionExportChecksumMismatchError](/api/@graphorin/sessions/errors/classes/SessionExportChecksumMismatchError.md) | Thrown when a `--hash` footer's checksum does not match the recomputed body checksum on import. |
| [SessionExportEncryptionRequiredError](/api/@graphorin/sessions/errors/classes/SessionExportEncryptionRequiredError.md) | Thrown when `--encrypt` was used at write time but the import caller did not supply the matching passphrase. |
| [SessionExportFormatInvalidError](/api/@graphorin/sessions/errors/classes/SessionExportFormatInvalidError.md) | Thrown by `Session.import(...)` when the JSONL stream does not begin with the expected `kind: 'meta'` sentinel header. |
| [SessionExportSchemaTooNewError](/api/@graphorin/sessions/errors/classes/SessionExportSchemaTooNewError.md) | Thrown when the import schema MAJOR is more than one version newer than the reader supports. |
| [SessionExportSchemaUnsupportedError](/api/@graphorin/sessions/errors/classes/SessionExportSchemaUnsupportedError.md) | Thrown when the import schema MAJOR is older than N-2 of the reader. Use the `migrate-export` migrator to advance to a supported MAJOR before importing. |
| [SessionNotFoundError](/api/@graphorin/sessions/errors/classes/SessionNotFoundError.md) | Thrown when `Session.fork(...)` or other methods receive a session id that does not exist in the metadata store. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [SessionErrorCode](/api/@graphorin/sessions/errors/type-aliases/SessionErrorCode.md) | Stable code discriminator surfaced on every [SessionError](/api/@graphorin/sessions/errors/classes/SessionError.md). |
