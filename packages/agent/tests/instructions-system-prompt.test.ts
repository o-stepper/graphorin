import type { ProviderRequest } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

/** Stub Memory whose `contextEngine.assemble` returns a fixed system prompt. */
function fakeAssemblingMemory(content: string, onAssemble?: () => void): Memory {
  const engine = {
    async assemble() {
      onAssemble?.();
      return { systemMessage: { role: 'system' as const, content } };
    },
    async shouldCompact() {
      return false;
    },
  };
  return { contextEngine: engine } as unknown as Memory;
}

describe('Agent - system prompt assembly from `instructions`', () => {
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

  it('resolves a sync function-form instructions into the system message (AG-8)', async () => {
    let capturedRequest: ProviderRequest | undefined;
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 8)] });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'fn-sync',
      instructions: (ctx) => `You are agent ${ctx.agentId}.`,
      provider: wrapped,
    });
    await agent.run('hi');
    const first = capturedRequest?.messages[0];
    expect(first?.role).toBe('system');
    if (first?.role === 'system') {
      expect(first.content).toContain('You are agent ');
    }
  });

  it('awaits an async function-form instructions (AG-8)', async () => {
    let capturedRequest: ProviderRequest | undefined;
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 8)] });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'fn-async',
      instructions: async () => 'ASYNC SYSTEM PROMPT',
      provider: wrapped,
    });
    await agent.run('hi');
    const first = capturedRequest?.messages[0];
    expect(first?.role).toBe('system');
    if (first?.role === 'system') {
      expect(first.content).toBe('ASYNC SYSTEM PROMPT');
    }
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

  it('builds the system prompt via memory.contextEngine.assemble when autoAssembleContext is on (CE-1)', async () => {
    let capturedRequest: ProviderRequest | undefined;
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 8)] });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'assembler',
      instructions: 'BASE INSTRUCTIONS',
      provider: wrapped,
      memory: fakeAssemblingMemory('<graphorin_memory_base>ASSEMBLED</graphorin_memory_base>'),
      autoAssembleContext: true,
    });
    await agent.run('hi');
    const first = capturedRequest?.messages[0];
    expect(first?.role).toBe('system');
    if (first?.role === 'system') {
      expect(first.content).toBe('<graphorin_memory_base>ASSEMBLED</graphorin_memory_base>');
    }
  });

  it('keeps plain instructions and does NOT call assemble when autoAssembleContext is off (CE-1 default)', async () => {
    let capturedRequest: ProviderRequest | undefined;
    let assembleCalls = 0;
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done', 8)] });
    const wrapped = {
      ...provider,
      stream(req: ProviderRequest) {
        capturedRequest = req;
        return provider.stream(req);
      },
    };
    const agent = createAgent({
      name: 'plain',
      instructions: 'BASE INSTRUCTIONS',
      provider: wrapped,
      memory: fakeAssemblingMemory('SHOULD-NOT-APPEAR', () => {
        assembleCalls += 1;
      }),
      // autoAssembleContext omitted ⇒ default false
    });
    await agent.run('hi');
    const first = capturedRequest?.messages[0];
    expect(first?.role).toBe('system');
    if (first?.role === 'system') expect(first.content).toBe('BASE INSTRUCTIONS');
    expect(assembleCalls).toBe(0);
  });
});
