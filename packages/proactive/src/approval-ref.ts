/**
 * Serialized agent-approval address for messenger callback-data (C3).
 *
 * The workflow side already has `wf:<workflowId>:<threadId>:<name>`
 * (`serializeAwakeableRef` in `@graphorin/workflow`, decision D-1 /
 * A3); this is the agent-approval counterpart: a parked agent run is
 * addressed by its run id plus the pending approval's tool-call id,
 * and resolved through `POST /v1/runs/:runId/resume` with an
 * `approvals: [{ toolCallId, granted }]` body. The `run:` prefix keeps
 * the two ref families distinguishable inside one callback-data slot.
 *
 * @packageDocumentation
 */

/** The agent-approval address triple behind a `run:` ref. @stable */
export interface AgentApprovalRef {
  readonly runId: string;
  readonly toolCallId: string;
}

const REF_PREFIX = 'run';

/**
 * Serialize an approval address as `run:<runId>:<toolCallId>` with
 * URI-encoded segments. Throws `TypeError` on an empty segment.
 *
 * @stable
 */
export function serializeApprovalRef(ref: AgentApprovalRef): string {
  if (ref.runId.length === 0 || ref.toolCallId.length === 0) {
    throw new TypeError(
      '[graphorin/proactive] serializeApprovalRef: runId and toolCallId must be non-empty',
    );
  }
  return `${REF_PREFIX}:${encodeURIComponent(ref.runId)}:${encodeURIComponent(ref.toolCallId)}`;
}

/**
 * Parse a `run:<runId>:<toolCallId>` ref. Returns `null` on anything
 * malformed - callback-data is untrusted channel input and must never
 * throw at the parse boundary.
 *
 * @stable
 */
export function parseApprovalRef(raw: string): AgentApprovalRef | null {
  if (typeof raw !== 'string') return null;
  const parts = raw.split(':');
  if (parts.length !== 3 || parts[0] !== REF_PREFIX) return null;
  try {
    const runId = decodeURIComponent(parts[1] as string);
    const toolCallId = decodeURIComponent(parts[2] as string);
    if (runId.length === 0 || toolCallId.length === 0) return null;
    return { runId, toolCallId };
  } catch {
    return null;
  }
}
