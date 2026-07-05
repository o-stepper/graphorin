/**
 * Streaming JSONL reader for the
 * `graphorin-tool-cassette/1.0` schema.
 *
 * The reader is forgiving by construction (lenient-forward-parse on
 * unknown record kinds; N-2 backwards-compat band; strict checksum
 * verification when the footer carries one).
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import {
  CassetteCursorViolationError,
  CassetteFormatInvalidError,
  SessionExportChecksumMismatchError,
  SessionExportSchemaTooNewError,
  SessionExportSchemaUnsupportedError,
} from '../errors/index.js';
import {
  TOOL_CASSETTE_BACKWARDS_COMPAT_MAJORS,
  TOOL_CASSETTE_FORMAT,
  TOOL_CASSETTE_SCHEMA_CURRENT,
  type ToolCallRecord,
  type ToolCassetteFooterRecord,
  type ToolCassetteMetaRecord,
  type ToolCassetteParsedRecord,
  type ToolCassetteRecord,
  type ToolCassetteRecordKind,
} from './types.js';

/**
 * Read result.
 *
 * @stable
 */
export interface ToolCassetteReadResult {
  readonly meta: ToolCassetteMetaRecord;
  readonly records: ReadonlyArray<ToolCassetteParsedRecord>;
  readonly toolCalls: ReadonlyArray<ToolCallRecord>;
  readonly footer: ToolCassetteFooterRecord;
  readonly warnings: ReadonlyArray<{
    readonly kind: 'unknown-record' | 'schema-future-minor';
    readonly message: string;
  }>;
}

/**
 * Parse a cassette body. Validates the sentinel header / footer,
 * the schema MAJOR band, the body checksum (when present), and the
 * `tool-call` cursor monotonicity.
 *
 * @stable
 */
export function readToolCassette(body: string): ToolCassetteReadResult {
  const lines = splitLines(body);
  if (lines.length < 2) {
    throw new CassetteFormatInvalidError(
      'expected at least a meta header + footer (got empty stream)',
    );
  }
  const headerLine = lines[0];
  if (headerLine === undefined) {
    throw new CassetteFormatInvalidError('missing meta header');
  }
  const meta = parseHeader(headerLine);
  validateSchemaMajor(meta.version);
  const warnings: {
    readonly kind: 'unknown-record' | 'schema-future-minor';
    readonly message: string;
  }[] = [];
  const records: ToolCassetteParsedRecord[] = [];
  const toolCalls: ToolCallRecord[] = [];
  let footer: ToolCassetteFooterRecord | undefined;
  const bodyHash = createHash('sha256');
  let lastStepNumber: number | undefined;
  // RP-4: track the tool-call ids seen in the CURRENT step. Parallel tool-calls
  // share a step and their provider ids carry no lexicographic order, so the
  // cursor only rejects a step regression or an exact (same step + same id)
  // duplicate - not a "decreasing" id within the step.
  let stepToolCallIds = new Set<string>();
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined || line.length === 0) continue;
    let parsed: Readonly<Record<string, unknown>>;
    try {
      parsed = JSON.parse(line) as Readonly<Record<string, unknown>>;
    } catch {
      throw new CassetteFormatInvalidError(`malformed JSONL on line ${i + 1}`);
    }
    if (parsed.kind === 'footer') {
      footer = parsed as unknown as ToolCassetteFooterRecord;
      continue;
    }
    bodyHash.update(`${line}\n`, 'utf8');
    const record = parseBodyRecord(parsed, warnings);
    records.push(record);
    if (record.kind === 'tool-call') {
      const tcRecord = record;
      if (lastStepNumber !== undefined && tcRecord.stepNumber < lastStepNumber) {
        throw new CassetteCursorViolationError(
          `tool-call cursor must not regress: previous stepNumber=${lastStepNumber} ` +
            `> incoming stepNumber=${tcRecord.stepNumber} (toolCallId='${tcRecord.toolCallId}')`,
        );
      }
      if (tcRecord.stepNumber !== lastStepNumber) {
        // A new step - reset the per-step id set.
        stepToolCallIds = new Set<string>();
        lastStepNumber = tcRecord.stepNumber;
      }
      if (stepToolCallIds.has(tcRecord.toolCallId)) {
        throw new CassetteCursorViolationError(
          `duplicate tool-call id '${tcRecord.toolCallId}' within step ${tcRecord.stepNumber}`,
        );
      }
      stepToolCallIds.add(tcRecord.toolCallId);
      toolCalls.push(tcRecord);
    }
  }
  if (footer === undefined) {
    throw new CassetteFormatInvalidError('missing sentinel footer');
  }
  if (footer.checksum !== undefined) {
    const expected = footer.checksum;
    const actual = `sha256:${bodyHash.digest('hex')}`;
    if (expected !== actual) {
      throw new SessionExportChecksumMismatchError(expected, actual);
    }
  }
  return Object.freeze({
    meta,
    records,
    toolCalls,
    footer,
    warnings,
  });
}

function splitLines(body: string): ReadonlyArray<string> {
  const trimmed = body.endsWith('\n') ? body.slice(0, -1) : body;
  if (trimmed.length === 0) return [];
  return trimmed.split('\n');
}

function parseHeader(line: string): ToolCassetteMetaRecord {
  let parsed: Readonly<Record<string, unknown>>;
  try {
    parsed = JSON.parse(line) as Readonly<Record<string, unknown>>;
  } catch {
    throw new CassetteFormatInvalidError('meta header is not valid JSON');
  }
  if (parsed.kind !== 'meta') {
    throw new CassetteFormatInvalidError(
      `expected line 1 to be { kind: 'meta', ... } (got kind=${String(parsed.kind)})`,
    );
  }
  if (parsed.format !== TOOL_CASSETTE_FORMAT) {
    throw new CassetteFormatInvalidError(
      `expected format='${TOOL_CASSETTE_FORMAT}' (got format='${String(parsed.format)}')`,
    );
  }
  if (typeof parsed.version !== 'string' || !/^\d+\.\d+$/.test(parsed.version)) {
    throw new CassetteFormatInvalidError(
      `expected version to be 'MAJOR.MINOR' (got '${String(parsed.version)}')`,
    );
  }
  return parsed as unknown as ToolCassetteMetaRecord;
}

function validateSchemaMajor(version: string): void {
  const importedMajor = parseInt(version.split('.', 2)[0] ?? '0', 10);
  const readerMajor = parseInt(TOOL_CASSETTE_SCHEMA_CURRENT.split('.', 2)[0] ?? '0', 10);
  if (importedMajor > readerMajor) {
    throw new SessionExportSchemaTooNewError(version, TOOL_CASSETTE_SCHEMA_CURRENT);
  }
  if (importedMajor < readerMajor - TOOL_CASSETTE_BACKWARDS_COMPAT_MAJORS) {
    throw new SessionExportSchemaUnsupportedError(version, TOOL_CASSETTE_SCHEMA_CURRENT);
  }
}

const KNOWN_KINDS = new Set<ToolCassetteRecordKind>([
  'meta',
  'tool-call',
  'tool-search-resolved',
  'model-fallback',
  'compaction',
  'progress-artifact-ref',
  'audit',
  'footer',
]);

function parseBodyRecord(
  parsed: Readonly<Record<string, unknown>>,
  warnings: { kind: 'unknown-record' | 'schema-future-minor'; message: string }[],
): ToolCassetteParsedRecord {
  const kind = parsed.kind;
  if (typeof kind !== 'string') {
    throw new CassetteFormatInvalidError('body record missing string `kind`');
  }
  if (!KNOWN_KINDS.has(kind as ToolCassetteRecordKind)) {
    warnings.push({
      kind: 'unknown-record',
      message: `Skipping unknown cassette record kind '${kind}' (lenient-forward-parse).`,
    });
    return { kind: 'unknown', raw: parsed };
  }
  return parsed as unknown as ToolCassetteRecord;
}
