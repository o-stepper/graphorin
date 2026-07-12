/**
 * Externally reconstructable awakeable address (A3, item 16 tail).
 *
 * The canonical address of a pending awakeable/approval is the triple
 * `(workflowId, threadId, name)` - exactly what the REST surface
 * consumes (`POST /v1/workflows/:workflowId/resume` with
 * `{ threadId, name }`). These helpers serialize the triple into a
 * single compact string of the shape
 *
 *   `wf:<workflowId>:<threadId>:<name>`
 *
 * (segments URI-encoded) so channel surfaces with a single opaque
 * payload slot - a messenger button's callback data, an email link -
 * can round-trip the address without a side table. No process is
 * involved: both functions are pure.
 *
 * @packageDocumentation
 */

/** Address triple of a pending awakeable / approval. @stable */
export interface AwakeableRef {
  /** Workflow id/name the thread belongs to (the REST path segment). */
  readonly workflowId: string;
  readonly threadId: string;
  /** Caller-chosen awakeable / approval name inside the thread. */
  readonly name: string;
}

const REF_PREFIX = 'wf';

/**
 * Serialize an {@link AwakeableRef} into `wf:<workflowId>:<threadId>:<name>`
 * with URI-encoded segments. Throws `TypeError` when any segment is
 * empty - a partial address is unresolvable by construction.
 *
 * @stable
 */
export function serializeAwakeableRef(ref: AwakeableRef): string {
  for (const [field, value] of [
    ['workflowId', ref.workflowId],
    ['threadId', ref.threadId],
    ['name', ref.name],
  ] as const) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new TypeError(
        `[graphorin/workflow] serializeAwakeableRef: '${field}' must be a non-empty string`,
      );
    }
  }
  return [
    REF_PREFIX,
    encodeURIComponent(ref.workflowId),
    encodeURIComponent(ref.threadId),
    encodeURIComponent(ref.name),
  ].join(':');
}

/**
 * Parse a string produced by {@link serializeAwakeableRef}. Returns
 * `null` on anything malformed (wrong prefix, wrong arity, empty or
 * undecodable segments) - callback data arriving from a channel is
 * untrusted input, so the parse never throws.
 *
 * @stable
 */
export function parseAwakeableRef(raw: string): AwakeableRef | null {
  if (typeof raw !== 'string') return null;
  const parts = raw.split(':');
  if (parts.length !== 4 || parts[0] !== REF_PREFIX) return null;
  const decoded: string[] = [];
  for (const part of parts.slice(1)) {
    if (part === undefined || part.length === 0) return null;
    try {
      decoded.push(decodeURIComponent(part));
    } catch {
      return null;
    }
  }
  const [workflowId, threadId, name] = decoded;
  if (workflowId === undefined || threadId === undefined || name === undefined) return null;
  if (workflowId.length === 0 || threadId.length === 0 || name.length === 0) return null;
  return { workflowId, threadId, name };
}
