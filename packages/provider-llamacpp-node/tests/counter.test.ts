/**
 * Coverage for `LlamaCppNativeCounter` — wraps `model.tokenize(text)`
 * from the loaded GGUF instance.
 */
import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { LlamaCppNativeCounter } from '../src/counter.js';
import type { LlamaModelInstance } from '../src/runtime.js';

function fixtureModel(opts: { tokenize?: (text: string) => Uint32Array } = {}): LlamaModelInstance {
  const tokenize = opts.tokenize ?? ((text: string) => new Uint32Array(text.length));
  return {
    tokenize,
    async createContext() {
      return { getSequence: () => ({}) };
    },
  };
}

const FIXTURE_MESSAGES: Message[] = [
  { role: 'user', content: 'hello' },
  { role: 'assistant', content: 'hi' },
];

describe('LlamaCppNativeCounter', () => {
  it('count(messages) sums per-message tokenized lengths', async () => {
    const counter = new LlamaCppNativeCounter({ model: fixtureModel() });
    const total = await counter.count(FIXTURE_MESSAGES);
    expect(total).toBeGreaterThan(0);
    // Two messages, each serialised with `[role]` prefix; the
    // fixture tokenizer yields one token per character.
    expect(total).toBe('[user]\nhello'.length + '[assistant]\nhi'.length);
  });

  it('countText("") returns 0 without calling tokenize', async () => {
    let calls = 0;
    const counter = new LlamaCppNativeCounter({
      model: fixtureModel({
        tokenize: (text: string) => {
          calls++;
          return new Uint32Array(text.length);
        },
      }),
    });
    expect(await counter.countText('')).toBe(0);
    expect(calls).toBe(0);
  });

  it('countText(non-empty) returns model.tokenize(text).length', async () => {
    const counter = new LlamaCppNativeCounter({ model: fixtureModel() });
    expect(await counter.countText('abc')).toBe(3);
  });

  it('id includes the modelPath fingerprint when supplied', () => {
    const a = new LlamaCppNativeCounter({
      model: fixtureModel(),
      modelPath: '/tmp/fixture-a.gguf',
    });
    const b = new LlamaCppNativeCounter({
      model: fixtureModel(),
      modelPath: '/tmp/fixture-b.gguf',
    });
    expect(a.id).not.toBe(b.id);
    expect(a.id.startsWith('llama-cpp-native@')).toBe(true);
    expect(b.id.startsWith('llama-cpp-native@')).toBe(true);
  });

  it('id falls back to "unknown" fingerprint without modelPath', () => {
    const counter = new LlamaCppNativeCounter({ model: fixtureModel() });
    expect(counter.id).toBe('llama-cpp-native@unknown');
  });

  it('honours an explicit id override', () => {
    const counter = new LlamaCppNativeCounter({
      model: fixtureModel(),
      id: 'custom-id',
    });
    expect(counter.id).toBe('custom-id');
  });

  it('returns 0 when tokenize returns null/undefined', async () => {
    const counter = new LlamaCppNativeCounter({
      model: {
        tokenize: (() => null) as unknown as (text: string) => readonly number[],
        async createContext() {
          return { getSequence: () => ({}) };
        },
      },
    });
    expect(await counter.countText('abc')).toBe(0);
  });

  it('returns 0 when tokenize returns a value with no length', async () => {
    const counter = new LlamaCppNativeCounter({
      model: {
        tokenize: (() => ({ noLength: true })) as unknown as (text: string) => readonly number[],
        async createContext() {
          return { getSequence: () => ({}) };
        },
      },
    });
    expect(await counter.countText('abc')).toBe(0);
  });

  it('version field is populated', () => {
    const counter = new LlamaCppNativeCounter({
      model: fixtureModel(),
      modelPath: '/tmp/fixture.gguf',
    });
    expect(counter.version).toContain('llama-cpp-native-');
    expect(counter.version).toContain('-v1');
  });
});
