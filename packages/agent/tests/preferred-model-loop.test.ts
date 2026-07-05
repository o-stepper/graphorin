import type { Provider, ProviderRequest, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function makeTool(name: string, preferredModel?: 'fast' | 'balanced' | 'smart') {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'pure',
    ...(preferredModel !== undefined ? { preferredModel } : {}),
    execute: async () => 'ok',
  } as Tool<unknown, unknown, unknown>;
}

/** Count how many step requests each provider actually served. */
function counting(base: Provider): { readonly provider: Provider; readonly served: () => number } {
  let served = 0;
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      served += 1;
      return base.stream(req);
    },
  } as Provider;
  return { provider, served: () => served };
}

describe('AG-15 - preferred-model resolves from CALLED tools, not the advertised catalogue', () => {
  it('a smart-hinted but never-called tool does not upgrade any step', async () => {
    const base = createMockProvider({
      modelId: 'default-model',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'plain', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const smartBase = createMockProvider({ modelId: 'smart-model', scripts: [] });
    const { provider, served } = counting(base);
    const { provider: smartProvider, served: smartServed } = counting(smartBase);

    const agent = createAgent({
      name: 'no-phantom-upgrade',
      instructions: 'noop',
      provider,
      tools: [makeTool('plain'), makeTool('expensive-analyzer', 'smart')],
      modelTierMap: { smart: smartProvider },
    });

    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(smartServed()).toBe(0); // the hint of an UNCALLED tool never fires
    expect(served()).toBe(2);
  });

  it('the upgrade DOES fire on the step after the hinted tool was actually called', async () => {
    const base = createMockProvider({
      modelId: 'default-model',
      scripts: [toolCallScript({ toolCallId: 'tc-1', toolName: 'expensive-analyzer', args: {} })],
    });
    const smartBase = createMockProvider({
      modelId: 'smart-model',
      scripts: [textOnlyScript('smart answer', 4)],
    });
    const { provider, served } = counting(base);
    const { provider: smartProvider, served: smartServed } = counting(smartBase);

    const agent = createAgent({
      name: 'real-upgrade',
      instructions: 'noop',
      provider,
      tools: [makeTool('expensive-analyzer', 'smart')],
      modelTierMap: { smart: smartProvider },
    });

    const result = await agent.run('analyze');
    expect(result.status).toBe('completed');
    expect(served()).toBe(1); // step 1: no prior calls -> agent default
    expect(smartServed()).toBe(1); // step 2: previous step called the smart-hinted tool
    expect(String(result.output)).toBe('smart answer');
  });
});
