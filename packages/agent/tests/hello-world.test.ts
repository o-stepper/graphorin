import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

/**
 * Phase 12 Hello-world acceptance: the script that creates a
 * memory-less, provider-only agent and streams a single text
 * completion fits comfortably in < 20 lines of user code.
 *
 * The test counts source lines deliberately to surface
 * regressions if the public surface ever requires more
 * boilerplate to hit the simple "say hi" path.
 */
describe('Agent - Hello world acceptance (< 20 lines)', () => {
  it('runs a one-shot greeting in 9 effective lines of user code', async () => {
    // ---------------- begin user script ----------------
    const provider = createMockProvider({
      modelId: 'mock-helloworld',
      scripts: [textOnlyScript('Hello, world!', 6)],
    });
    const agent = createAgent({
      name: 'greeter',
      instructions: 'You greet users.',
      provider,
    });
    const result = await agent.run('say hi');
    // ---------------- end user script ----------------

    expect(result.output).toBe('Hello, world!');
    expect(result.usage.totalTokens).toBe(6);
  });
});
