import { describe, expect, it } from 'vitest';

import {
  ALL_BUILT_IN_PATTERNS,
  BUILT_IN_PATTERNS,
  jsonSafeMask,
  jsonSafeSpan,
  OPT_IN_PATTERNS,
  type RedactionPattern,
} from '../../src/redaction/patterns.js';

describe('@graphorin/observability/redaction - patterns catalogue', () => {
  it('exports exactly 14 default-on built-in patterns', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(14);
  });

  it('exports the correct opt-in additions (ipv4, ipv6, gcp-service-account)', () => {
    const names = OPT_IN_PATTERNS.map((p) => p.name).sort();
    expect(names).toEqual(['gcp-service-account', 'ipv4', 'ipv6']);
  });

  it('every default-on pattern has a unique stable name', () => {
    const seen = new Set<string>();
    for (const p of BUILT_IN_PATTERNS) {
      expect(seen.has(p.name)).toBe(false);
      seen.add(p.name);
    }
  });

  it('every pattern declares a category and a regex', () => {
    for (const p of ALL_BUILT_IN_PATTERNS) {
      expect(['secret', 'pii']).toContain(p.category);
      expect(p.regex).toBeInstanceOf(RegExp);
      expect(p.regex.flags).toContain('g');
    }
  });
});

interface Fixture {
  readonly name: string;
  readonly positives: ReadonlyArray<string>;
  readonly negatives: ReadonlyArray<string>;
}

const FIXTURES: ReadonlyArray<Fixture> = [
  {
    name: 'graphorin-token',
    positives: [
      'token=gph_live_v1_AbCdEfGhIjKlMnOpQrStUvWx_a1b2c3',
      'gph_test_v1_aaaaaaaaaaaaaaaaaaaa_zzzzzz',
    ],
    negatives: ['gph_live_v0_short', 'gpx_live_v1_too_short_xxxxxx'],
  },
  {
    name: 'openai-key',
    positives: ['use sk-1234567890abcdefABCDEF12345', 'sk-proj_aaaaBBBBccccDDDD'],
    negatives: ['the answer is sk-no', 'sk_test_no'],
  },
  {
    name: 'anthropic-key',
    positives: ['call sk-ant-1234567890_abcdefghij'],
    negatives: ['sk-ant-short', 'ant-secret'],
  },
  {
    name: 'aws-access-key',
    // AWS's own published placeholder access-key IDs (see the IAM
    // documentation). They are not real credentials, but the GitHub
    // secret scanner still flags the literal token, so we assemble it
    // from fragments to keep the scanner quiet without watering down
    // the test fixture.
    positives: [`AKIA${'IOSFODNN7'}EXAMPLE`, `use ASIA${'IOSFODNN7'}EXAMPLE`],
    negatives: ['AKIAINVALID', 'random text'],
  },
  {
    name: 'github-pat',
    positives: [
      'ghp_1234567890abcdefABCDEFghijklmnopqrstuv',
      'gho_aaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbcc',
    ],
    negatives: ['gh_short', 'random'],
  },
  {
    name: 'jwt',
    positives: [
      'header eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    ],
    negatives: ['eyJ.short', 'no jwt here'],
  },
  {
    name: 'bearer-header',
    positives: ['Authorization: Bearer abcdef0123456789abcdef'],
    negatives: ['Bearer short', 'BearerNo'],
  },
  {
    name: 'basic-auth',
    positives: ['Authorization: Basic dXNlcjpwYXNzd29yZAo='],
    negatives: ['Basic short', 'plain log'],
  },
  {
    name: 'private-key-pem',
    positives: [
      '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBA...\n-----END RSA PRIVATE KEY-----',
    ],
    negatives: ['plain text', '-----BEGIN CERTIFICATE-----\n...'],
  },
  {
    name: 'email',
    positives: ['contact alice@example.com'],
    negatives: ['no@', 'not-an-email'],
  },
  {
    name: 'creditcard',
    positives: ['card 4111 1111 1111 1111', 'visa: 4111-1111-1111-1111'],
    negatives: [
      'only 12 digits 123456789012',
      // Decimal-adjacent runs are refused at the regex level so serialized
      // floats survive even when their digits happen to be Luhn-valid.
      '{"score":0.01639344262295082}',
      'p=0.4111111111111111',
      'total 4111111111119.75',
    ],
  },
  {
    name: 'us-ssn',
    positives: ['SSN 123-45-6789'],
    negatives: ['123 45 6789', 'no'],
  },
  {
    name: 'phone-e164',
    positives: ['call +14155551212'],
    negatives: ['415-555-1212 alone', 'not-phone'],
  },
  {
    name: 'iban',
    positives: ['DE89370400440532013000'],
    negatives: ['short', '12345'],
  },
];

describe('@graphorin/observability/redaction - pattern fixtures (14 default-on)', () => {
  for (const fixture of FIXTURES) {
    const pattern = BUILT_IN_PATTERNS.find((p) => p.name === fixture.name);
    if (pattern === undefined) {
      it.fails(`fixture ${fixture.name} resolves to a default-on pattern`, () => {
        // The describe block emits an explicit failure if one of the
        // 14 default-on patterns is missing.
      });
      continue;
    }
    describe(fixture.name, () => {
      it.each(fixture.positives.map((s) => [s] as const))('matches "%s"', (input: string) => {
        const fresh = new RegExp(pattern.regex.source, pattern.regex.flags);
        expect(fresh.test(input)).toBe(true);
      });
      it.each(
        fixture.negatives.map((s) => [s] as const),
      )('does not match "%s"', (input: string) => {
        const fresh = new RegExp(pattern.regex.source, pattern.regex.flags);
        expect(fresh.test(input)).toBe(false);
      });
    });
  }
});

describe('@graphorin/observability/redaction - every default-on pattern has fixtures', () => {
  it('FIXTURES covers every default-on pattern', () => {
    const fixtured = new Set(FIXTURES.map((f) => f.name));
    const defaults = new Set<string>();
    for (const p of BUILT_IN_PATTERNS as readonly RedactionPattern[]) defaults.add(p.name);
    expect([...defaults].sort()).toEqual([...fixtured].sort());
  });
});

describe('@graphorin/observability/redaction - creditcard verify (Luhn + network prefix)', () => {
  const creditcard = BUILT_IN_PATTERNS.find((p) => p.name === 'creditcard');

  it('accepts major-network PANs (leading digit 2-6)', () => {
    expect(creditcard?.verify?.('4111111111111111')).toBe(true);
    expect(creditcard?.verify?.('5500 0000 0000 0004')).toBe(true);
    expect(creditcard?.verify?.('2221000000000009')).toBe(true);
  });

  it('rejects Luhn-valid runs outside the major-network leading digits', () => {
    // Snowflake-style id (leading 1) and petroleum-range run (leading 7):
    // both pass Luhn but are not consumer PANs.
    expect(creditcard?.verify?.('1240000000000000001')).toBe(false);
    expect(creditcard?.verify?.('7700000000000008')).toBe(false);
  });

  it('rejects Luhn-invalid runs regardless of prefix', () => {
    expect(creditcard?.verify?.('4111111111111112')).toBe(false);
  });
});

describe('@graphorin/observability/redaction - jsonSafeMask', () => {
  const M = '[REDACTED creditcard]';

  it('quotes the mask in bare JSON value positions', () => {
    const object = '{"card":4111111111111111}';
    expect(jsonSafeMask(object, object.indexOf('4111'), 16, M)).toBe(`"${M}"`);
    const spaced = '{"card":  4111111111111111  }';
    expect(jsonSafeMask(spaced, spaced.indexOf('4111'), 16, M)).toBe(`"${M}"`);
    const array = '[4111111111111111,1]';
    expect(jsonSafeMask(array, array.indexOf('4111'), 16, M)).toBe(`"${M}"`);
    const whole = '4111111111111111';
    expect(jsonSafeMask(whole, whole.indexOf('4111'), 16, M)).toBe(`"${M}"`);
  });

  it('returns the mask unchanged outside value positions', () => {
    const prose = 'card 4111111111111111 thanks';
    expect(jsonSafeMask(prose, prose.indexOf('4111'), 16, M)).toBe(M);
    const stringLeaf = '{"card":"4111111111111111"}';
    expect(jsonSafeMask(stringLeaf, stringLeaf.indexOf('4111'), 16, M)).toBe(M);
    const leadingProse = '4111111111111111 is my card';
    expect(jsonSafeMask(leadingProse, leadingProse.indexOf('4111'), 16, M)).toBe(M);
  });

  it('keeps its historical unquoted result for a signed numeric leaf', () => {
    // The string-returning signature cannot absorb the `-`, so the wrapper
    // deliberately falls back to the plain mask; span-aware callers use
    // `jsonSafeSpan` instead.
    const object = '{"card":-4111111111111111}';
    expect(jsonSafeMask(object, object.indexOf('4111'), 16, M)).toBe(M);
  });
});

describe('@graphorin/observability/redaction - jsonSafeSpan', () => {
  const M = '[REDACTED creditcard]';

  const apply = (source: string, span: { start: number; end: number; text: string }): string =>
    source.slice(0, span.start) + span.text + source.slice(span.end);

  it('absorbs the minus sign of a signed numeric leaf and quotes the mask', () => {
    const object = '{"card":-4111111111111111}';
    const span = jsonSafeSpan(object, object.indexOf('4111'), 16, M);
    expect(span).toEqual({ start: object.indexOf('-'), end: object.length - 1, text: `"${M}"` });
    expect(JSON.parse(apply(object, span))).toEqual({ card: M });
  });

  it('absorbs the sign across insignificant whitespace', () => {
    const spaced = '{"card": -4111111111111111 }';
    const span = jsonSafeSpan(spaced, spaced.indexOf('4111'), 16, M);
    expect(JSON.parse(apply(spaced, span))).toEqual({ card: M });
  });

  it('handles signed leaves in arrays and at top level', () => {
    const array = '[-4111111111111111,2]';
    expect(JSON.parse(apply(array, jsonSafeSpan(array, array.indexOf('4111'), 16, M)))).toEqual([
      M,
      2,
    ]);
    const whole = '-4111111111111111';
    expect(JSON.parse(apply(whole, jsonSafeSpan(whole, whole.indexOf('4111'), 16, M)))).toBe(M);
  });

  it('keeps a prose minus outside the span (mask unquoted)', () => {
    const prose = 'refund -4111111111111111 issued';
    const span = jsonSafeSpan(prose, prose.indexOf('4111'), 16, M);
    expect(span).toEqual({
      start: prose.indexOf('4111'),
      end: prose.indexOf(' issued'),
      text: M,
    });
    expect(apply(prose, span)).toBe('refund -[REDACTED creditcard] issued');
  });

  it('covers exactly the match when the right side is not a value boundary', () => {
    const notValue = '{"card":-4111111111111111x}';
    const span = jsonSafeSpan(notValue, notValue.indexOf('4111'), 16, M);
    expect(span).toEqual({
      start: notValue.indexOf('4111'),
      end: notValue.indexOf('x'),
      text: M,
    });
  });

  it('quotes positive leaves without moving the span start', () => {
    const object = '{"card":4111111111111111}';
    const span = jsonSafeSpan(object, object.indexOf('4111'), 16, M);
    expect(span).toEqual({
      start: object.indexOf('4111'),
      end: object.length - 1,
      text: `"${M}"`,
    });
  });
});
