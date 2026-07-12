/**
 * B4 (D-12) - the gateway consults the optional injection classifier
 * on every inbound body; classifier failures never break the
 * pipeline.
 */
import { describe, expect, it, vi } from 'vitest';
import type { InjectionClassifier } from '../src/inbound.js';
import {
  type ChannelInboundContext,
  createAccessController,
  createChannelGateway,
  createIdentityRouter,
} from '../src/index.js';
import { createLoopbackAdapter } from '../src/testkit/index.js';

async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

function build(classifier: InjectionClassifier) {
  const adapter = createLoopbackAdapter();
  const seen: ChannelInboundContext[] = [];
  const gateway = createChannelGateway({
    adapters: [adapter],
    router: createIdentityRouter({ routes: [{ agentId: 'assistant' }] }),
    access: createAccessController({ policy: { kind: 'open' } }),
    injectionClassifier: classifier,
    warn: () => {},
    onMessage: async (ctx) => {
      seen.push(ctx);
      return undefined;
    },
  });
  return { adapter, gateway, seen };
}

describe('gateway injectionClassifier option', () => {
  it('a flagged classification lands in sanitization.patternsHit', async () => {
    const classifier: InjectionClassifier = {
      id: 'stub',
      classify: vi.fn(async () => ({ flagged: true })),
    };
    const { adapter, gateway, seen } = build(classifier);
    await gateway.start();
    await adapter.inject({ text: 'a benign looking forwarded note' });
    await settle();
    expect(classifier.classify).toHaveBeenCalledTimes(1);
    expect(seen[0]?.sanitization.patternsHit).toContain('classifier:stub');
    await gateway.stop();
  });

  it('a throwing classifier never blocks the pipeline', async () => {
    const classifier: InjectionClassifier = {
      id: 'boom',
      classify: async () => {
        throw new Error('engine crashed');
      },
    };
    const { adapter, gateway, seen } = build(classifier);
    await gateway.start();
    await adapter.inject({ text: 'hello there' });
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0]?.sanitizedText).toContain('hello there');
    await gateway.stop();
  });
});
