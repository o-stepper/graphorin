import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

const FRAMEWORK_PATH = '/repo/packages/agent/src/runtime.js';
const APP_PATH = '/home/user/projects/myapp/src/main.js';

describe('@graphorin/no-implicit-network-call', () => {
  it('flags a bare fetch() in framework code', () => {
    const messages = lintSource({
      source: `await fetch('https://example.com');`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('forbidden');
  });

  it('flags axios.get / axios.post / axios calls', () => {
    const messages = lintSource({
      source: `
        await axios.get('/x');
        await axios.post('/y');
        await axios({ url: '/z' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBe(3);
    expect(messages.every((m) => m.messageId === 'forbidden')).toBe(true);
  });

  it('flags https.request / http.request', () => {
    const messages = lintSource({
      source: `
        const req = https.request({ host: 'example.com' });
        const req2 = http.request({ host: 'example.com' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it('flags new XMLHttpRequest()', () => {
    const messages = lintSource({
      source: `const xhr = new XMLHttpRequest();`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toHaveLength(1);
  });

  it('respects the graphorin-allow-network opt-out comment', () => {
    const messages = lintSource({
      source: `
        // graphorin-allow-network: provider adapter; user explicitly initiated
        await fetch('https://api.openai.com/v1/chat/completions');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('does NOT flag fetch() in non-framework consumer code', () => {
    const messages = lintSource({
      source: `await fetch('/api/data');`,
      rule: 'no-implicit-network-call',
      filename: APP_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('ignores unrelated function calls', () => {
    const messages = lintSource({
      source: `
        Promise.resolve();
        myAdapter.send({ data: 'ok' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toEqual([]);
  });
});
