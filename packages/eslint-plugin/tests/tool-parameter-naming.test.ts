import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

const RULE = 'tool-parameter-naming' as const;

describe('tool-parameter-naming', () => {
  it('produces no findings for self-documenting parameter names', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'send_email',
          description: 'Send a transactional email via the configured SMTP gateway.',
          inputSchema: z.object({
            recipientEmail: z.string(),
            subject: z.string(),
            body: z.string(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('flags ambiguous single-word parameter names', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'send_email',
          description: 'Send a transactional email via the configured SMTP gateway.',
          inputSchema: z.object({
            to: z.string(),
            subject: z.string(),
            body: z.string(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('ambiguous');
  });

  it('flags numeric-suffix parameter names', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'shoebox',
          description: 'Stash two arguments into a shoebox; legacy interface.',
          inputSchema: z.object({
            arg1: z.string(),
            arg2: z.number(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(2);
    const ids = messages.map((m) => m.messageId);
    expect(ids).toEqual(['numericSuffix', 'numericSuffix']);
  });

  it('honours `tags: ["experimental"]` per-tool opt-out', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'experimental_send',
          description: 'Experimental sender; skip parameter-naming discipline during the spike.',
          tags: ['experimental'],
          inputSchema: z.object({
            to: z.string(),
            arg1: z.string(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('honours `tags: ["legacy"]` per-tool opt-out', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'legacy_send',
          description: 'Long-tail legacy sender pending RB-49 rename.',
          tags: ['legacy'],
          inputSchema: z.object({
            to: z.string(),
            arg1: z.string(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(0);
  });

  it('does not opt out for unrelated tags', () => {
    const messages = lintSource({
      rule: RULE,
      source: `
        export const t = tool({
          name: 'production_send',
          description: 'Production sender with a tag that should not opt out of naming discipline.',
          tags: ['production'],
          inputSchema: z.object({
            to: z.string(),
          }),
        });
      `,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('ambiguous');
  });
});
