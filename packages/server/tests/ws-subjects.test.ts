import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import { isSubjectAllowed, requiredScopeFor, tryParseSubject } from '../src/ws/subjects.js';

describe('tryParseSubject', () => {
  it('parses every well-formed subject shape', () => {
    expect(tryParseSubject('session:abc/events')).toEqual({
      ok: true,
      subject: { kind: 'session-events', sessionId: 'abc' },
    });
    expect(tryParseSubject('session:abc/runs/r1/events')).toEqual({
      ok: true,
      subject: { kind: 'session-run-events', sessionId: 'abc', runId: 'r1' },
    });
    expect(tryParseSubject('agent:foo/runs/r1/events')).toEqual({
      ok: true,
      subject: { kind: 'agent-run-events', agentId: 'foo', runId: 'r1' },
    });
    expect(tryParseSubject('workflow:wf-1/events')).toEqual({
      ok: true,
      subject: { kind: 'workflow-events', workflowId: 'wf-1' },
    });
    expect(tryParseSubject('memory/conflicts')).toEqual({
      ok: true,
      subject: { kind: 'memory-conflicts' },
    });
    expect(tryParseSubject('audit/events')).toEqual({
      ok: true,
      subject: { kind: 'audit-events' },
    });
  });

  it('rejects wildcards', () => {
    const result = tryParseSubject('session:*/events');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('wildcard-not-supported');
  });

  it('rejects malformed subjects', () => {
    expect(tryParseSubject('').ok).toBe(false);
    expect(tryParseSubject('not-a-subject').ok).toBe(false);
  });
});

describe('requiredScopeFor + isSubjectAllowed', () => {
  it('binds the right scope per subject kind', () => {
    // periphery-10: session streams are read-only, so they gate on the
    // sessions:read family (the resource slot is a sessionId), not on
    // agents:invoke whose slot is an agentId everywhere else.
    expect(requiredScopeFor({ kind: 'session-events', sessionId: 'abc' }).raw).toBe(
      'sessions:read:abc',
    );
    expect(requiredScopeFor({ kind: 'session-run-events', sessionId: 'abc', runId: 'r' }).raw).toBe(
      'sessions:read:abc',
    );
    expect(requiredScopeFor({ kind: 'agent-run-events', agentId: 'a', runId: 'r' }).raw).toBe(
      'agents:read:a',
    );
  });

  it('honours wildcard grants', () => {
    expect(
      isSubjectAllowed([parseScope('sessions:read:*')], {
        kind: 'session-events',
        sessionId: 'abc',
      }),
    ).toBe(true);
    expect(
      isSubjectAllowed([parseScope('sessions:*')], {
        kind: 'session-events',
        sessionId: 'abc',
      }),
    ).toBe(true);
  });

  it('rejects when no granted scope matches', () => {
    expect(
      isSubjectAllowed([parseScope('memory:read')], {
        kind: 'session-events',
        sessionId: 'abc',
      }),
    ).toBe(false);
  });
});
