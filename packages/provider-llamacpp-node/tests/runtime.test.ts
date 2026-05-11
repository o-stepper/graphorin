/**
 * Coverage for the `loadLlamaModule(...)` lazy loader. The suite uses
 * the documented `runtimeOverrides.getLlama` short-circuit so the real
 * `node-llama-cpp` peer is never loaded.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { __resetLlamaCache, type LlamaInstance, loadLlamaModule } from '../src/runtime.js';

function fakeInstance(): LlamaInstance {
  return {
    async loadModel() {
      return {
        tokenize() {
          return new Uint32Array(0);
        },
        async createContext() {
          return { getSequence: () => ({}) };
        },
      };
    },
  };
}

describe('loadLlamaModule', () => {
  afterEach(() => {
    __resetLlamaCache();
  });

  it('returns the override.getLlama() result without touching the real peer', async () => {
    const instance = fakeInstance();
    const got = await loadLlamaModule({ getLlama: async () => instance });
    expect(got).toBe(instance);
  });

  it('__resetLlamaCache is callable and does not throw', () => {
    expect(() => __resetLlamaCache()).not.toThrow();
  });
});
