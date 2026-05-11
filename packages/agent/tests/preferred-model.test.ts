import type { Provider } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { pickTopTierAcrossTools, resolvePreferredModel } from '../src/preferred-model/index.js';

const fakeProvider = (name: string, modelId: string): Provider =>
  ({
    name,
    modelId,
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200000,
      maxOutput: 8192,
    },
    stream: () => {
      throw new Error('not implemented');
    },
    generate: () => {
      throw new Error('not implemented');
    },
  }) as unknown as Provider;

describe('pickTopTierAcrossTools', () => {
  it('returns undefined for empty / all-undefined hints', () => {
    expect(pickTopTierAcrossTools([])).toBeUndefined();
    expect(pickTopTierAcrossTools([undefined, undefined])).toBeUndefined();
  });
  it('picks the highest tier across the supplied hints', () => {
    expect(pickTopTierAcrossTools(['fast', 'balanced', 'fast'])).toEqual({ hint: 'balanced' });
    expect(pickTopTierAcrossTools(['fast', 'smart'])).toEqual({ hint: 'smart' });
  });
  it('treats explicit ModelSpec as the highest tier (treat-as-smart)', () => {
    const spec = fakeProvider('p', 'm');
    const top = pickTopTierAcrossTools(['fast', spec]);
    expect(top?.hint).toBe('smart');
    expect(top?.spec).toBe(spec);
  });
});

describe('resolvePreferredModel — precedence ladder', () => {
  const haiku = fakeProvider('haiku', 'haiku-4.5');
  const opus = fakeProvider('opus', 'opus-4.7');
  const sonnet = fakeProvider('sonnet', 'sonnet-4.5');
  const ps = fakeProvider('ps', 'prepare-step-explicit');

  it('prepareStep override always wins', () => {
    const r = resolvePreferredModel({
      prepareStepProvider: ps,
      toolPreferredModels: ['fast'],
      agentPreferredModel: 'smart',
      agentDefaultProvider: sonnet,
      modelTierMap: { fast: haiku, smart: opus },
    });
    expect(r.source).toBe('prepare-step');
    expect(r.resolvedProvider).toBe(ps);
  });

  it('resolves a per-tool tier hint via modelTierMap', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: ['fast'],
      agentDefaultProvider: sonnet,
      modelTierMap: { fast: haiku },
    });
    expect(r.source).toBe('tier-map');
    expect(r.hintApplied).toBe('fast');
    expect(r.resolvedProvider).toBe(haiku);
  });

  it('uses an explicit ModelSpec hint over the tier vocabulary', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: [opus],
      agentDefaultProvider: sonnet,
      modelTierMap: { smart: haiku },
    });
    expect(r.source).toBe('spec');
    expect(r.resolvedProvider).toBe(opus);
  });

  it('multi-tool tie-break picks the highest tier', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: ['fast', 'balanced', 'smart'],
      agentDefaultProvider: sonnet,
      modelTierMap: { fast: haiku, balanced: sonnet, smart: opus },
    });
    expect(r.hintApplied).toBe('smart');
    expect(r.resolvedProvider).toBe(opus);
  });

  it('falls through to the agent-preferred default when the tier is not mapped', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: ['smart'],
      agentPreferredModel: 'balanced',
      agentDefaultProvider: sonnet,
      modelTierMap: { fast: haiku, balanced: sonnet },
    });
    expect(r.fallthroughReason).toBe('tier-not-mapped');
    expect(r.source).toBe('agent-preferred');
    expect(r.resolvedProvider).toBe(sonnet);
  });

  it('falls through to the agent default provider when nothing else matches', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: [undefined],
      agentDefaultProvider: sonnet,
    });
    expect(r.source).toBe('fallthrough-default');
    expect(r.resolvedProvider).toBe(sonnet);
  });

  it('honours an Agent.preferredModel hint when no per-tool hint resolves', () => {
    const r = resolvePreferredModel({
      toolPreferredModels: [undefined],
      agentPreferredModel: 'smart',
      agentDefaultProvider: sonnet,
      modelTierMap: { smart: opus },
    });
    expect(r.source).toBe('agent-preferred');
    expect(r.hintApplied).toBe('smart');
    expect(r.resolvedProvider).toBe(opus);
  });
});
