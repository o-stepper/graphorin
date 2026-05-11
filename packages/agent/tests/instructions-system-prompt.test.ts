import type { ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

describe('Agent — system prompt assembly from `instructions`', () => {
  it('injects the agent.instructions string as the first system message before the user input', async () => {
    let capturedRequest: ProviderRequest | undefined;
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('done', 8)],
    });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'helpful',
      instructions: 'You are a concise, helpful assistant.',
      provider: wrapped,
    });
    await agent.run('hi');
    expect(capturedRequest).toBeDefined();
    const first = capturedRequest?.messages[0];
    const second = capturedRequest?.messages[1];
    expect(first?.role).toBe('system');
    if (first?.role === 'system') {
      expect(first.content).toBe('You are a concise, helpful assistant.');
    }
    expect(second?.role).toBe('user');
  });

  it('omits the system message when instructions is the empty string', async () => {
    let capturedRequest: ProviderRequest | undefined;
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('done', 4)],
    });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'no-prompt',
      instructions: '',
      provider: wrapped,
    });
    await agent.run('hi');
    const first = capturedRequest?.messages[0];
    expect(first?.role).toBe('user');
  });
});
