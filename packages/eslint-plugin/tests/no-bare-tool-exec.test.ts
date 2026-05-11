import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

describe('@graphorin/no-bare-tool-exec', () => {
  it('passes when execute references ctx.signal', () => {
    const messages = lintSource({
      source: `
        const t = tool({
          name: 'fetch_url',
          execute: async (args, ctx) => {
            const res = await fetch(args.url, { signal: ctx.signal });
            return res.text();
          },
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toEqual([]);
  });

  it('passes when execute references signal via destructuring', () => {
    const messages = lintSource({
      source: `
        const t = tool({
          name: 'fetch_url',
          execute: async (args, { signal }) => {
            return fetch(args.url, { signal });
          },
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toEqual([]);
  });

  it('flags execute that does not reference signal', () => {
    const messages = lintSource({
      source: `
        const t = tool({
          name: 'fetch_url',
          execute: async (args) => {
            return fetch(args.url);
          },
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('missingSignal');
    expect(messages[0]?.message).toContain('fetch_url');
  });

  it('respects the graphorin-allow-bare-exec opt-out comment', () => {
    const messages = lintSource({
      source: `
        // graphorin-allow-bare-exec: pure function with no I/O
        const t = tool({
          name: 'add',
          execute: async (args) => args.a + args.b,
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toEqual([]);
  });

  it('handles execute as a regular FunctionExpression', () => {
    const messages = lintSource({
      source: `
        const t = tool({
          name: 'fetch_url',
          execute: async function (args) {
            return fetch(args.url);
          },
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toHaveLength(1);
  });

  it('ignores tool() with no execute property', () => {
    const messages = lintSource({
      source: `const t = tool({ name: 'noop' });`,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toEqual([]);
  });

  it('handles execute referencing request.signal as well', () => {
    const messages = lintSource({
      source: `
        const t = tool({
          name: 'fetch_url',
          execute: async (args, request) => {
            return fetch(args.url, { signal: request.signal });
          },
        });
      `,
      rule: 'no-bare-tool-exec',
    });
    expect(messages).toEqual([]);
  });
});
