/**
 * Typed error surface for `@graphorin/sessions`.
 *
 * Every error class extends the base {@link SessionError} which is a
 * thin wrapper around `Error` with a stable `code` discriminator so
 * callers can `switch` on it without parsing messages.
 *
 * @packageDocumentation
 */

/**
 * Stable code discriminator surfaced on every {@link SessionError}.
 *
 * @stable
 */
export type SessionErrorCode =
  | 'replay-access-denied'
  | 'cassette-idempotency-mismatch'
  | 'cassette-schema-mismatch'
  | 'cassette-artifact-missing'
  | 'cassette-cursor-violation'
  | 'cassette-format-invalid'
  | 'session-export-format-invalid'
  | 'session-export-schema-too-new'
  | 'session-export-schema-unsupported'
  | 'session-export-checksum-mismatch'
  | 'session-export-encryption-required'
  | 'session-not-found'
  | 'session-closed'
  | 'agent-not-found'
  | 'invalid-commentary-policy';

/**
 * Base class for every error thrown from `@graphorin/sessions`.
 *
 * @stable
 */
export class SessionError extends Error {
  readonly code: SessionErrorCode;
  constructor(code: SessionErrorCode, message: string, name = 'SessionError') {
    super(message);
    this.name = name;
    this.code = code;
  }
}

/**
 * Thrown by `Session.replay({ raw: true })` when the calling context's
 * scope set does not include `traces:read:raw`.
 *
 * @stable
 */
export class ReplayAccessDeniedError extends SessionError {
  constructor(target: string) {
    super(
      'replay-access-denied',
      `Raw replay access denied for ${target}: scope 'traces:read:raw' is required.`,
      'ReplayAccessDeniedError',
    );
  }
}

/**
 * Thrown when a cassette record's `sha256OfArgs` does not match the
 * live invocation's argument hash AND `failOnIdempotencyMismatch:
 * true` is configured. Default behaviour is to continue with the
 * recorded result and surface the divergence in the event stream.
 *
 * @stable
 */
export class CassetteIdempotencyMismatchError extends SessionError {
  readonly toolName: string;
  readonly recordedSha256: string;
  readonly liveSha256: string;
  constructor(toolName: string, recordedSha256: string, liveSha256: string) {
    super(
      'cassette-idempotency-mismatch',
      `Cassette idempotency mismatch on ${toolName}: recorded sha256(args)=${recordedSha256} ` +
        `differs from live sha256(args)=${liveSha256}.`,
      'CassetteIdempotencyMismatchError',
    );
    this.toolName = toolName;
    this.recordedSha256 = recordedSha256;
    this.liveSha256 = liveSha256;
  }
}

/**
 * Thrown when a cassette's recorded `output` no longer validates
 * against the tool's `outputSchema` AND `failOnSchemaMismatch: true`
 * is configured (the default).
 *
 * @stable
 */
export class CassetteSchemaMismatchError extends SessionError {
  readonly toolName: string;
  readonly issues: string;
  constructor(toolName: string, issues: string) {
    super(
      'cassette-schema-mismatch',
      `Cassette schema mismatch on ${toolName}: ${issues}.`,
      'CassetteSchemaMismatchError',
    );
    this.toolName = toolName;
    this.issues = issues;
  }
}

/**
 * Thrown when a cassette's `contentPartsRefs` resolution fails AND
 * `onMissingArtifact: 'abort'` is configured (the default).
 *
 * @stable
 */
export class CassetteArtifactMissingError extends SessionError {
  readonly toolName: string;
  readonly missingPath: string;
  constructor(toolName: string, missingPath: string) {
    super(
      'cassette-artifact-missing',
      `Cassette artifact missing on ${toolName}: '${missingPath}' could not be opened.`,
      'CassetteArtifactMissingError',
    );
    this.toolName = toolName;
    this.missingPath = missingPath;
  }
}

/**
 * Thrown when the cassette cursor is not monotonically advancing
 * (`stepNumber` ascending; `toolCallId` tiebreak). Indicates a
 * corrupted or maliciously crafted cassette.
 *
 * @stable
 */
export class CassetteCursorViolationError extends SessionError {
  constructor(message: string) {
    super('cassette-cursor-violation', message, 'CassetteCursorViolationError');
  }
}

/**
 * Thrown when the cassette JSONL stream does not begin with a
 * `kind: 'meta'` sentinel header carrying
 * `format: 'graphorin-tool-cassette'`.
 *
 * @stable
 */
export class CassetteFormatInvalidError extends SessionError {
  constructor(reason: string) {
    super(
      'cassette-format-invalid',
      `Invalid cassette format: ${reason}.`,
      'CassetteFormatInvalidError',
    );
  }
}

/**
 * Thrown by `Session.import(...)` when the JSONL stream does not
 * begin with the expected `kind: 'meta'` sentinel header.
 *
 * @stable
 */
export class SessionExportFormatInvalidError extends SessionError {
  constructor(reason: string) {
    super(
      'session-export-format-invalid',
      `Invalid session export format: ${reason}.`,
      'SessionExportFormatInvalidError',
    );
  }
}

/**
 * Thrown when the import schema MAJOR is more than one version newer
 * than the reader supports.
 *
 * @stable
 */
export class SessionExportSchemaTooNewError extends SessionError {
  readonly importedVersion: string;
  readonly readerVersion: string;
  constructor(importedVersion: string, readerVersion: string) {
    super(
      'session-export-schema-too-new',
      `Session export schema ${importedVersion} is newer than reader ${readerVersion}. ` +
        'Upgrade @graphorin/sessions to import this file.',
      'SessionExportSchemaTooNewError',
    );
    this.importedVersion = importedVersion;
    this.readerVersion = readerVersion;
  }
}

/**
 * Thrown when the import schema MAJOR is older than N-2 of the
 * reader. Use the `migrate-export` migrator to advance to a supported
 * MAJOR before importing.
 *
 * @stable
 */
export class SessionExportSchemaUnsupportedError extends SessionError {
  readonly importedVersion: string;
  readonly readerVersion: string;
  constructor(importedVersion: string, readerVersion: string) {
    super(
      'session-export-schema-unsupported',
      `Session export schema ${importedVersion} is older than the N-2 backward-compat window ` +
        `for reader ${readerVersion}. Run \`graphorin migrate-export\` to advance the file.`,
      'SessionExportSchemaUnsupportedError',
    );
    this.importedVersion = importedVersion;
    this.readerVersion = readerVersion;
  }
}

/**
 * Thrown when a `--hash` footer's checksum does not match the
 * recomputed body checksum on import.
 *
 * @stable
 */
export class SessionExportChecksumMismatchError extends SessionError {
  readonly expected: string;
  readonly actual: string;
  constructor(expected: string, actual: string) {
    super(
      'session-export-checksum-mismatch',
      `Session export checksum mismatch: expected ${expected}, got ${actual}.`,
      'SessionExportChecksumMismatchError',
    );
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Thrown when `--encrypt` was used at write time but the import
 * caller did not supply the matching passphrase.
 *
 * @stable
 */
export class SessionExportEncryptionRequiredError extends SessionError {
  constructor() {
    super(
      'session-export-encryption-required',
      'Session export is encrypted; supply the passphrase via the importer options to decrypt.',
      'SessionExportEncryptionRequiredError',
    );
  }
}

/**
 * Thrown when `Session.fork(...)` or other methods receive a session
 * id that does not exist in the metadata store.
 *
 * @stable
 */
export class SessionNotFoundError extends SessionError {
  readonly sessionId: string;
  constructor(sessionId: string) {
    super('session-not-found', `Session ${sessionId} does not exist.`, 'SessionNotFoundError');
    this.sessionId = sessionId;
  }
}

/**
 * Thrown by `Session.push(...)` when the session has been closed (RP-6).
 * `close()` is a real lifecycle boundary, not advisory — reopen the session
 * (a fresh `create`) or write to a different one.
 *
 * @stable
 */
export class SessionClosedError extends SessionError {
  readonly sessionId: string;
  constructor(sessionId: string) {
    super(
      'session-closed',
      `Session ${sessionId} is closed; cannot push new messages.`,
      'SessionClosedError',
    );
    this.sessionId = sessionId;
  }
}

/**
 * Thrown when an `AgentRegistry.delete(...)` / `retire(...)` is called
 * for an unknown id and the caller passed `{ assertExists: true }`.
 *
 * @stable
 */
export class AgentNotFoundError extends SessionError {
  readonly agentId: string;
  constructor(agentId: string) {
    super('agent-not-found', `Agent ${agentId} is not registered.`, 'AgentNotFoundError');
    this.agentId = agentId;
  }
}
