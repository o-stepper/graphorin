/**
 * Strict subject grammar enforced by the WS dispatcher. Subjects are
 * the multiplexing primitive over a single WS connection: every
 * subscription is keyed by a subject, every event carries the
 * subject it was emitted into, and the per-subject scope check
 * happens at subscription time.
 *
 * Wildcards are deferred to v0.2+ - the dispatcher rejects any
 * subject containing `'*'` or `'#'` so the ACL surface stays
 * tractable.
 *
 * @packageDocumentation
 */

import type { ParsedScope } from '@graphorin/security/auth';
import { parseScope, scopeMatches } from '@graphorin/security/auth';

/**
 * Discriminated union of every recognised subject form. Surfaced on
 * audit log entries + diagnostics; the wire still carries the raw
 * string.
 *
 * @stable
 */
export type ParsedSubject =
  | { readonly kind: 'session-events'; readonly sessionId: string }
  | {
      readonly kind: 'session-run-events';
      readonly sessionId: string;
      readonly runId: string;
    }
  | {
      readonly kind: 'agent-run-events';
      readonly agentId: string;
      readonly runId: string;
    }
  | { readonly kind: 'workflow-events'; readonly workflowId: string }
  | {
      readonly kind: 'workflow-run-events';
      readonly workflowId: string;
      readonly runId: string;
    }
  | { readonly kind: 'memory-conflicts' }
  | { readonly kind: 'audit-events' };

/**
 * Result of {@link tryParseSubject}.
 *
 * @stable
 */
export type ParseSubjectResult =
  | { readonly ok: true; readonly subject: ParsedSubject }
  | {
      readonly ok: false;
      readonly reason: 'wildcard-not-supported' | 'unknown-subject' | 'malformed';
    };

const SESSION_EVENTS = /^session:([A-Za-z0-9_-]+)\/events$/;
const SESSION_RUN_EVENTS = /^session:([A-Za-z0-9_-]+)\/runs\/([A-Za-z0-9_-]+)\/events$/;
const AGENT_RUN_EVENTS = /^agent:([A-Za-z0-9_-]+)\/runs\/([A-Za-z0-9_-]+)\/events$/;
const WORKFLOW_EVENTS = /^workflow:([A-Za-z0-9_-]+)\/events$/;
const WORKFLOW_RUN_EVENTS = /^workflow:([A-Za-z0-9_-]+)\/runs\/([A-Za-z0-9_-]+)\/events$/;

/**
 * Parse a subject string into the {@link ParsedSubject} discriminator.
 *
 * @stable
 */
export function tryParseSubject(raw: string): ParseSubjectResult {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { ok: false, reason: 'malformed' };
  }
  if (raw.includes('*') || raw.includes('#')) {
    return { ok: false, reason: 'wildcard-not-supported' };
  }
  if (raw === 'memory/conflicts') {
    return { ok: true, subject: { kind: 'memory-conflicts' } };
  }
  if (raw === 'audit/events') {
    return { ok: true, subject: { kind: 'audit-events' } };
  }
  let m = raw.match(SESSION_RUN_EVENTS);
  if (m !== null) {
    return {
      ok: true,
      subject: { kind: 'session-run-events', sessionId: m[1] ?? '', runId: m[2] ?? '' },
    };
  }
  m = raw.match(AGENT_RUN_EVENTS);
  if (m !== null) {
    return {
      ok: true,
      subject: { kind: 'agent-run-events', agentId: m[1] ?? '', runId: m[2] ?? '' },
    };
  }
  m = raw.match(SESSION_EVENTS);
  if (m !== null) {
    return { ok: true, subject: { kind: 'session-events', sessionId: m[1] ?? '' } };
  }
  m = raw.match(WORKFLOW_RUN_EVENTS);
  if (m !== null) {
    return {
      ok: true,
      subject: { kind: 'workflow-run-events', workflowId: m[1] ?? '', runId: m[2] ?? '' },
    };
  }
  m = raw.match(WORKFLOW_EVENTS);
  if (m !== null) {
    return { ok: true, subject: { kind: 'workflow-events', workflowId: m[1] ?? '' } };
  }
  return { ok: false, reason: 'unknown-subject' };
}

/**
 * Required scope literal for every subject kind, expressed as a
 * `ParsedScope`. The matcher `scopeMatches(granted, required)` uses
 * the standard wildcard rules from `@graphorin/security/auth`
 * (e.g. `agents:*` matches `agents:invoke:foo`).
 *
 * @stable
 */
export function requiredScopeFor(subject: ParsedSubject): ParsedScope {
  switch (subject.kind) {
    // periphery-10: session streams are READ-ONLY, so they gate on
    // `sessions:read:<sessionId>` - consistent with the SSE route's
    // `sessions:read` requirement (which the old `agents:invoke:<x>`
    // requirement silently stacked on top of), and the resource slot
    // is a sessionId under the sessions family instead of overloading
    // `agents:invoke` (whose slot is an agentId everywhere else).
    case 'session-events':
      return parseScope(`sessions:read:${subject.sessionId}`);
    case 'session-run-events':
      return parseScope(`sessions:read:${subject.sessionId}`);
    case 'agent-run-events':
      return parseScope(`agents:read:${subject.agentId}`);
    case 'workflow-events':
      return parseScope(`workflows:read:${subject.workflowId}`);
    case 'workflow-run-events':
      return parseScope(`workflows:read:${subject.workflowId}`);
    case 'memory-conflicts':
      return parseScope('memory:read');
    case 'audit-events':
      return parseScope('audit:read');
  }
}

/**
 * Compatibility shim - re-exports `scopeMatches` so consumers don't
 * have to learn the security package's surface.
 *
 * @stable
 */
export function isSubjectAllowed(
  granted: ReadonlyArray<ParsedScope>,
  subject: ParsedSubject,
): boolean {
  const required = requiredScopeFor(subject);
  for (const scope of granted) {
    if (scopeMatches(scope, required)) return true;
  }
  return false;
}
