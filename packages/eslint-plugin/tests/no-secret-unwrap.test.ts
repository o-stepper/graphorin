import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

const RULE = 'no-secret-unwrap' as const;

describe('no-secret-unwrap', () => {
  it('flags `.reveal()` calls without an opt-out comment', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        function leakSecret(secret) {
          const value = secret.reveal();
          return value;
        }
      `,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('avoidReveal');
  });

  it('does NOT flag `.reveal()` when the call site carries the opt-out comment on the previous line', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        function emitSignedHeader(secret) {
          // graphorin-allow-secret-unwrap: required for HMAC signature
          const raw = secret.reveal();
          return raw;
        }
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('flags `.unwrap()` even when the opt-out comment is present (deprecation supersedes opt-out)', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        function legacyHelper(secret) {
          // graphorin-allow-secret-unwrap: legacy-call-site
          const raw = secret.unwrap();
          return raw;
        }
      `,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('avoidUnwrap');
  });

  it('ignores `.use()` calls (preferred scoped read pattern)', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        async function preferredRead(secret) {
          return secret.use(async (raw) => raw.length);
        }
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('ignores `.useBuffer()` calls', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        async function preferredRead(secret) {
          return secret.useBuffer(async (buf) => buf.length);
        }
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('flags both `.reveal()` and `.unwrap()` in the same source', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        function badPair(secret) {
          const a = secret.reveal();
          const b = secret.unwrap();
          return a + b;
        }
      `,
    });
    expect(messages).toHaveLength(2);
    const ids = messages.map((m) => m.messageId).sort();
    expect(ids).toEqual(['avoidReveal', 'avoidUnwrap']);
  });
});

/** W-043: the allowReceiverPattern carve-out for non-secret receivers. */
describe('@graphorin/no-secret-unwrap - allowReceiverPattern (W-043)', () => {
  const FRAMEWORK_PATH = '/repo/packages/security/src/example.js';

  it('still errors on Zod-style unwrap by default (fixes nothing silently)', () => {
    const messages = lintSource({
      source: `const inner = optionalSchema.unwrap();`,
      rule: 'no-secret-unwrap',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('avoidUnwrap');
  });

  it('skips a receiver matching the configured pattern', () => {
    const messages = lintSource({
      source: `const inner = optionalSchema.unwrap();`,
      rule: 'no-secret-unwrap',
      filename: FRAMEWORK_PATH,
      options: [{ allowReceiverPattern: 'Schema$' }],
    });
    expect(messages).toEqual([]);
  });

  it('keeps flagging a non-matching receiver with the option set', () => {
    const messages = lintSource({
      source: `const value = secret.unwrap();`,
      rule: 'no-secret-unwrap',
      filename: FRAMEWORK_PATH,
      options: [{ allowReceiverPattern: 'Schema$' }],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('avoidUnwrap');
  });

  it('skips reveal() too when the receiver matches', () => {
    const messages = lintSource({
      source: `const inner = resultSchema.reveal();`,
      rule: 'no-secret-unwrap',
      filename: FRAMEWORK_PATH,
      options: [{ allowReceiverPattern: 'Schema$' }],
    });
    expect(messages).toEqual([]);
  });
});
