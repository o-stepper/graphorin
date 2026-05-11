import { describe, expect, it } from 'vitest';

import {
  ALL_BUILT_IN_PATTERNS,
  BUILT_IN_PATTERNS,
  OPT_IN_PATTERNS,
  type RedactionPattern,
} from '../../src/redaction/patterns.js';

describe('@graphorin/observability/redaction — patterns catalogue', () => {
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
      'token=kru_prod_v1_AbCdEfGhIjKlMnOpQrStUvWx_a1b2c3',
      'kru_test_v1_aaaaaaaaaaaaaaaaaaaa_zzzzzz',
    ],
    negatives: ['kru_unknown_v0_short', 'krp_prod_v1_too_short_xxxxxx'],
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
    positives: ['AKIAIOSFODNN7EXAMPLE', 'use ASIAIOSFODNN7EXAMPLE'],
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
    negatives: ['only 12 digits 123456789012'],
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

describe('@graphorin/observability/redaction — pattern fixtures (14 default-on)', () => {
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

describe('@graphorin/observability/redaction — every default-on pattern has fixtures', () => {
  it('FIXTURES covers every default-on pattern', () => {
    const fixtured = new Set(FIXTURES.map((f) => f.name));
    const defaults = new Set<string>();
    for (const p of BUILT_IN_PATTERNS as readonly RedactionPattern[]) defaults.add(p.name);
    expect([...defaults].sort()).toEqual([...fixtured].sort());
  });
});
