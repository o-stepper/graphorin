/**
 * `ollamaAdapter` `public-tls` trust-tier coverage. The adapter must
 * accept a public-host HTTPS baseUrl, narrow `acceptsSensitivity` to
 * `['public']`, and emit a one-line WARN.
 */
import { describe, expect, it } from 'vitest';

import { ollamaAdapter } from '../../src/adapters/ollama.js';

interface LogCall {
  level: 'warn' | 'info';
  message: string;
}

describe('ollamaAdapter — public-tls trust class', () => {
  it('accepts an https://public-host baseUrl and narrows sensitivity to public', () => {
    const log: LogCall[] = [];
    const fetchImpl: typeof fetch = (async () =>
      new Response(null, { status: 200 })) as typeof fetch;
    const adapter = ollamaAdapter({
      model: 'llama3.1',
      baseUrl: 'https://hosted-ollama.example.com',
      fetchImpl,
      logger: (level, message) => log.push({ level, message }),
    });
    expect(adapter.acceptsSensitivity).toEqual(['public']);
    expect(log.some((c) => c.level === 'warn' && c.message.includes('public-TLS endpoint'))).toBe(
      true,
    );
  });
});
