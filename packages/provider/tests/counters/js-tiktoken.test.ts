/**
 * Coverage for the `js-tiktoken`-backed counter using a `moduleOverride`
 * stub so the suite never imports the real peer dependency.
 */
import type { Message } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';

import { __resetTiktokenCache, JsTiktokenCounter } from '../../src/counters/js-tiktoken.js';

interface TiktokenEncoding {
  readonly name?: string;
  encode(text: string): { length: number };
}

interface TiktokenModule {
  getEncoding(name: string): TiktokenEncoding;
  encodingForModel?: (model: string) => TiktokenEncoding;
}

function makeStub(args: {
  perChar?: boolean;
  hasEncodingForModel?: boolean;
  modelEncodingThrows?: boolean;
}): TiktokenModule & {
  calls: { getEncoding: string[]; encodingForModel: string[] };
} {
  const calls = { getEncoding: [] as string[], encodingForModel: [] as string[] };
  const oneTokenPerChar: TiktokenEncoding = {
    name: 'one-per-char',
    encode(text: string) {
      // Deterministic: one token per Unicode code unit.
      return { length: text.length };
    },
  };
  const halfChars: TiktokenEncoding = {
    name: 'half-chars',
    encode(text: string) {
      return { length: Math.ceil(text.length / 2) };
    },
  };
  const mod: TiktokenModule & { calls: typeof calls } = {
    calls,
    getEncoding(name: string) {
      calls.getEncoding.push(name);
      return args.perChar === false ? halfChars : oneTokenPerChar;
    },
  };
  if (args.hasEncodingForModel === true) {
    mod.encodingForModel = (modelId: string) => {
      calls.encodingForModel.push(modelId);
      if (args.modelEncodingThrows === true) {
        throw new Error('no encoding for that model');
      }
      return halfChars;
    };
  }
  return mod;
}

function userMessage(text: string): Message {
  return { role: 'user', content: text };
}

describe('JsTiktokenCounter', () => {
  afterEach(() => {
    __resetTiktokenCache();
  });

  it('counts text via the encoder returned from getEncoding', async () => {
    const moduleOverride = makeStub({});
    const counter = new JsTiktokenCounter({ moduleOverride });
    expect(await counter.countText('hello')).toBe(5);
    expect(moduleOverride.calls.getEncoding).toEqual(['cl100k_base']);
  });

  it('returns 0 for empty text without invoking the encoder', async () => {
    const moduleOverride = makeStub({});
    const counter = new JsTiktokenCounter({ moduleOverride });
    expect(await counter.countText('')).toBe(0);
    // No cache hit: the encoder is lazy and only loads on first non-empty call.
    expect(moduleOverride.calls.getEncoding).toEqual([]);
  });

  it('count(messages) sums encoder.encode(serializedToString(...)) per message', async () => {
    const moduleOverride = makeStub({});
    const counter = new JsTiktokenCounter({ moduleOverride });
    const a = userMessage('hi');
    const b = userMessage('there');
    const total = await counter.count([a, b]);
    const single = await counter.count([a]);
    const single2 = await counter.count([b]);
    expect(total).toBe(single + single2);
    expect(total).toBeGreaterThan(0);
  });

  it('caches the encoder across calls (single getEncoding lookup per counter)', async () => {
    const moduleOverride = makeStub({});
    const counter = new JsTiktokenCounter({ moduleOverride });
    await counter.countText('a');
    await counter.countText('b');
    await counter.countText('c');
    expect(moduleOverride.calls.getEncoding).toEqual(['cl100k_base']);
  });

  it('prefers encodingForModel when supplied', async () => {
    const moduleOverride = makeStub({ hasEncodingForModel: true });
    const counter = new JsTiktokenCounter({
      moduleOverride,
      modelId: 'gpt-5',
    });
    expect(await counter.countText('abcd')).toBe(2); // halfChars(4)
    expect(moduleOverride.calls.encodingForModel).toEqual(['gpt-5']);
    expect(moduleOverride.calls.getEncoding).toEqual([]);
  });

  it('falls back to the explicit encoding when encodingForModel throws', async () => {
    const moduleOverride = makeStub({
      hasEncodingForModel: true,
      modelEncodingThrows: true,
    });
    const counter = new JsTiktokenCounter({ moduleOverride, modelId: 'unknown' });
    expect(await counter.countText('abcd')).toBe(4); // oneTokenPerChar
    expect(moduleOverride.calls.getEncoding).toEqual(['cl100k_base']);
  });

  it('exposes a stable id derived from the encoding name (or override)', () => {
    const counter = new JsTiktokenCounter({
      moduleOverride: makeStub({}),
      encoding: 'o200k_base',
    });
    expect(counter.id).toBe('js-tiktoken@o200k_base');
    const named = new JsTiktokenCounter({
      moduleOverride: makeStub({}),
      id: 'custom-id',
    });
    expect(named.id).toBe('custom-id');
  });

  it('__resetTiktokenCache clears the module cache', () => {
    expect(() => __resetTiktokenCache()).not.toThrow();
  });

  // PROVIDER-CT-01: real js-tiktoken defaults disallowedSpecial to 'all'
  // and THROWS on a special-token sequence in the input. The counter must
  // treat such sequences as ordinary text (disallowedSpecial=[]) so counting
  // arbitrary user/model input never crashes.
  it('does not throw on text containing a special-token sequence', async () => {
    // Stub mirroring js-tiktoken: throws unless the caller disallows nothing.
    const specialGuardModule: TiktokenModule = {
      getEncoding() {
        return {
          name: 'special-guard',
          encode(
            text: string,
            _allowedSpecial?: readonly string[] | 'all',
            disallowedSpecial?: readonly string[] | 'all',
          ) {
            const guardsAll = disallowedSpecial === undefined || disallowedSpecial === 'all';
            if (guardsAll && text.includes('<|endoftext|>')) {
              throw new Error(
                'The text contains a special token that is not allowed: <|endoftext|>',
              );
            }
            return { length: text.length };
          },
        };
      },
    };
    const counter = new JsTiktokenCounter({ moduleOverride: specialGuardModule });
    await expect(counter.countText('summarize <|endoftext|> please')).resolves.toBe(30);
    await expect(counter.count([userMessage('hi <|endoftext|> there')])).resolves.toBeGreaterThan(
      0,
    );
  });
});
