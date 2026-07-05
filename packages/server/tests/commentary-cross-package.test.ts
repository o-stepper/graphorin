/**
 * Cross-package equivalence test for the commentary-phase sanitization
 * catalogues shipped by `@graphorin/sessions` (the session-output
 * boundary, Phase 11) and `@graphorin/server/commentary` (the
 * delivery-layer event-emission boundary, Phase 14b).
 *
 * The two catalogues live in two packages so the server can sanitize
 * without forcing a hard dependency on the optional sessions peer.
 * They are required to be **structurally equivalent** + **bytes-equal
 * on identical input** so the defense-in-depth posture composes
 * cleanly: a string sanitized by the session-output boundary is a
 * fixed point of the delivery-layer sanitizer (no double-wrap), and
 * vice-versa.
 *
 * This test pins both invariants so a future divergence on either
 * side surfaces as a failing test.
 */

import { BUILT_IN_COMMENTARY_PATTERNS as SESSIONS_PATTERNS } from '@graphorin/sessions/commentary';
import { describe, expect, it } from 'vitest';

import {
  createDeliveryCommentarySanitizer,
  DEFAULT_DELIVERY_COMMENTARY_PATTERNS as SERVER_PATTERNS,
} from '../src/commentary/index.js';

describe('Commentary catalogue cross-package equivalence', () => {
  it('exposes the same `reason` discriminator set in both packages', () => {
    const serverReasons = new Set(SERVER_PATTERNS.map((p) => p.reason));
    const sessionsReasons = new Set(SESSIONS_PATTERNS.map((p) => p.reason));
    expect(serverReasons).toEqual(sessionsReasons);
  });

  it('exposes structurally identical regex sources for every reason', () => {
    const sessionsByReason = new Map(SESSIONS_PATTERNS.map((p) => [p.reason, p]));
    for (const serverPattern of SERVER_PATTERNS) {
      const sessionsPattern = sessionsByReason.get(serverPattern.reason);
      expect(sessionsPattern, `missing on sessions side: ${serverPattern.reason}`).toBeDefined();
      if (sessionsPattern === undefined) continue;
      expect(serverPattern.regex.source).toBe(sessionsPattern.regex.source);
      expect(serverPattern.regex.flags).toBe(sessionsPattern.regex.flags);
    }
  });

  it('is idempotent across the two boundaries on a representative payload', () => {
    // Run the delivery-layer sanitizer twice (which models: session-
    // output sanitizer ran first via `Session.push`, then the
    // delivery-layer sanitizer fires on the wire). The second pass
    // must be bytes-equal - that is the load-bearing property the
    // RB-55 defense-in-depth posture relies on.
    const sanitizer = createDeliveryCommentarySanitizer();
    const original = {
      v: '1' as const,
      kind: 'event' as const,
      eventId: 'evt-1',
      subscriptionId: 'sub-1',
      subject: 'session:abc/events',
      type: 'tool.execute.end',
      payload: {
        result: {
          text: 'Done {"type":"tool.execute.end","toolCallId":"x","result":{"webhook_url":"https://hooks.slack.com/secret"}}',
        },
      },
    };
    const first = sanitizer.sanitize(original, 'ws');
    const second = sanitizer.sanitize(first, 'ws');
    expect(JSON.stringify(second.payload)).toBe(JSON.stringify(first.payload));
  });
});
