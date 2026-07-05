import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

import { describe, expect, it } from 'vitest';
import {
  canonicalConfigHash,
  createTransformersJsEmbedder,
  EmbedderModelLoadError,
  type FeatureExtractor,
  type PipelineFactory,
  TransformersJsEmbedder,
  VERSION,
} from '../src/index.js';

function makeStubPipelineFactory(dim: number): PipelineFactory {
  return async () => {
    const extractor: FeatureExtractor = async (texts) => {
      const list = Array.isArray(texts) ? texts : [texts as string];
      const data = new Float32Array(list.length * dim);
      for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < dim; j++) {
          data[i * dim + j] = (i + 1) * 0.01 + j * 0.001;
        }
      }
      return { data, dims: [list.length, dim] };
    };
    return extractor;
  };
}

function makeCapturingPipelineFactory(dim: number, captured: string[][]): PipelineFactory {
  return async () => {
    const extractor: FeatureExtractor = async (texts) => {
      const list = Array.isArray(texts) ? [...(texts as string[])] : [texts as string];
      captured.push(list);
      const data = new Float32Array(list.length * dim);
      return { data, dims: [list.length, dim] };
    };
    return extractor;
  };
}

describe('TransformersJsEmbedder', () => {
  it('VERSION constant matches the package version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('prefixes E5 inputs by taskType and never prefixes non-E5 models (PS-10)', async () => {
    const e5Texts: string[][] = [];
    const e5 = createTransformersJsEmbedder({
      model: 'Xenova/multilingual-e5-base',
      pipelineFactory: makeCapturingPipelineFactory(768, e5Texts),
    });
    await e5.embed(['weather in Tbilisi'], { taskType: 'query' });
    await e5.embed(['It is sunny.'], { taskType: 'passage' });
    await e5.embed(['no task type given']); // defaults to the passage role
    expect(e5Texts[0]).toEqual(['query: weather in Tbilisi']);
    expect(e5Texts[1]).toEqual(['passage: It is sunny.']);
    expect(e5Texts[2]).toEqual(['passage: no task type given']);

    const bgeTexts: string[][] = [];
    const bge = createTransformersJsEmbedder({
      model: 'Xenova/bge-small-en-v1.5',
      pipelineFactory: makeCapturingPipelineFactory(384, bgeTexts),
    });
    await bge.embed(['weather in Tbilisi'], { taskType: 'query' });
    expect(bgeTexts[0]).toEqual(['weather in Tbilisi']); // symmetric model: untouched
  });

  it('configHash reflects the E5 task-prefix policy without touching non-E5 (PS-10)', () => {
    const on = createTransformersJsEmbedder({ model: 'Xenova/multilingual-e5-base' });
    const off = createTransformersJsEmbedder({
      model: 'Xenova/multilingual-e5-base',
      disableTaskPrefix: true,
    });
    expect(on.configHash()).not.toBe(off.configHash()); // flipping the policy re-keys the id

    const bgeA = createTransformersJsEmbedder({ model: 'Xenova/bge-small-en-v1.5' });
    const bgeB = createTransformersJsEmbedder({
      model: 'Xenova/bge-small-en-v1.5',
      disableTaskPrefix: true,
    });
    expect(bgeA.configHash()).toBe(bgeB.configHash()); // irrelevant flag for symmetric models
  });

  it('default id includes the canonical model + dim', () => {
    const e = createTransformersJsEmbedder();
    expect(e.id()).toBe('transformersjs:Xenova/multilingual-e5-base@768');
    expect(e.dim()).toBe(768);
  });

  it('configHash is deterministic across rebuilds with identical config', () => {
    const a = createTransformersJsEmbedder({ pooling: 'mean', normalize: true });
    const b = createTransformersJsEmbedder({ pooling: 'mean', normalize: true });
    expect(a.configHash()).toBe(b.configHash());
  });

  it('configHash flips when normalize flips', () => {
    const a = createTransformersJsEmbedder({ pooling: 'mean', normalize: true });
    const b = createTransformersJsEmbedder({ pooling: 'mean', normalize: false });
    expect(a.configHash()).not.toBe(b.configHash());
  });

  it('configHash flips when model changes', () => {
    const a = createTransformersJsEmbedder({ model: 'Xenova/multilingual-e5-base' });
    const b = createTransformersJsEmbedder({ model: 'Xenova/multilingual-e5-small' });
    expect(a.configHash()).not.toBe(b.configHash());
  });

  it('embed returns one Float32Array per text with the model dim', async () => {
    const e = createTransformersJsEmbedder({
      model: 'Xenova/multilingual-e5-small',
      pipelineFactory: makeStubPipelineFactory(384),
    });
    const out = await e.embed(['hello', 'world']);
    expect(out.length).toBe(2);
    expect(out[0]?.length).toBe(384);
    expect(out[1]?.length).toBe(384);
  });

  it('embed of an empty array returns an empty array (no extractor load)', async () => {
    let invoked = 0;
    const e = createTransformersJsEmbedder({
      pipelineFactory: () => {
        invoked++;
        return Promise.reject(new Error('should not be called'));
      },
    });
    expect(await e.embed([])).toEqual([]);
    expect(invoked).toBe(0);
  });

  it('honours GRAPHORIN_CACHE_DIR for the cache_dir option', async () => {
    process.env.GRAPHORIN_CACHE_DIR = '/tmp/graphorin-cache';
    let captured: { cache_dir?: string } = {};
    const e = createTransformersJsEmbedder({
      pipelineFactory: async (_, __, opts) => {
        captured = opts;
        const extractor: FeatureExtractor = async (texts) => {
          const list = Array.isArray(texts) ? texts : [texts as string];
          const data = new Float32Array(list.length * 768);
          return { data, dims: [list.length, 768] };
        };
        return extractor;
      },
    });
    await e.embed(['x']);
    expect(captured.cache_dir).toBe('/tmp/graphorin-cache');
    delete process.env.GRAPHORIN_CACHE_DIR;
  });

  it('embed surfaces EmbedderModelLoadError when the pipeline factory fails', async () => {
    const e = createTransformersJsEmbedder({
      pipelineFactory: async () => {
        throw new Error('offline');
      },
    });
    await expect(e.embed(['x'])).rejects.toBeInstanceOf(EmbedderModelLoadError);
  });

  it('canonicalConfigHash is stable for nested objects with reordered keys', () => {
    expect(canonicalConfigHash({ a: 1, b: { c: 2, d: 3 } })).toBe(
      canonicalConfigHash({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });

  it('canonicalConfigHash differs for distinct values', () => {
    expect(canonicalConfigHash({ a: 1 })).not.toBe(canonicalConfigHash({ a: 2 }));
  });

  it('TransformersJsEmbedder is a class instance', () => {
    const e = createTransformersJsEmbedder();
    expect(e).toBeInstanceOf(TransformersJsEmbedder);
  });

  it('first embed resolves dim from the pipeline output if not pre-known', async () => {
    const e = createTransformersJsEmbedder({
      model: 'unknown-model',
      pipelineFactory: makeStubPipelineFactory(123),
    });
    // periphery-05 (PS-11 port): an unknown model with no `dim` hint
    // throws instead of silently assuming 768 - the assumed width baked
    // a wrong-width id + vec0 table, and the id then CHANGED after the
    // first embed (which lock-on-first reads as an embedder swap).
    expect(() => e.dim()).toThrow(/Unknown embedding width/);
    expect(() => e.id()).toThrow(/Unknown embedding width/);
    await e.embed(['hello']);
    expect(e.dim()).toBe(123);
    expect(e.id()).toBe('transformersjs:unknown-model@123');
  });

  it('an explicit dim hint binds the width and drift throws (periphery-05)', async () => {
    const e = createTransformersJsEmbedder({
      model: 'unknown-model',
      dim: 123,
      pipelineFactory: makeStubPipelineFactory(123),
    });
    expect(e.dim()).toBe(123);
    await expect(e.embed(['hello'])).resolves.toHaveLength(1);
    const wrong = createTransformersJsEmbedder({
      model: 'unknown-model',
      dim: 999,
      pipelineFactory: makeStubPipelineFactory(123),
    });
    await expect(wrong.embed(['hello'])).rejects.toThrow(/bound to 999/);
  });

  it('pipeline factory is called once across multiple embed() invocations (cache hit on second call)', async () => {
    let invocations = 0;
    const e = createTransformersJsEmbedder({
      model: 'Xenova/multilingual-e5-small',
      pipelineFactory: async () => {
        invocations++;
        const extractor: FeatureExtractor = async (texts) => {
          const list = Array.isArray(texts) ? texts : [texts as string];
          return { data: new Float32Array(list.length * 384), dims: [list.length, 384] };
        };
        return extractor;
      },
    });
    await e.embed(['a']);
    await e.embed(['b']);
    await e.embed(['c', 'd']);
    expect(invocations).toBe(1);
  });

  it('concurrent embed() calls share a single in-flight pipeline load', async () => {
    let invocations = 0;
    let resolve!: (extractor: FeatureExtractor) => void;
    const e = createTransformersJsEmbedder({
      model: 'Xenova/multilingual-e5-small',
      pipelineFactory: async () => {
        invocations++;
        return new Promise<FeatureExtractor>((r) => {
          resolve = r;
        });
      },
    });
    const a = e.embed(['a']);
    const b = e.embed(['b']);
    const c = e.embed(['c']);
    // Resolve the in-flight load once.
    const extractor: FeatureExtractor = async (texts) => {
      const list = Array.isArray(texts) ? texts : [texts as string];
      return { data: new Float32Array(list.length * 384), dims: [list.length, 384] };
    };
    resolve(extractor);
    await Promise.all([a, b, c]);
    expect(invocations).toBe(1);
  });

  it('honours an explicit revision pin on the pipeline factory call', async () => {
    let captured: { revision?: string } = {};
    const e = createTransformersJsEmbedder({
      revision: 'v1.2.3',
      pipelineFactory: async (_, __, opts) => {
        captured = opts;
        const extractor: FeatureExtractor = async (texts) => {
          const list = Array.isArray(texts) ? texts : [texts as string];
          return { data: new Float32Array(list.length * 768), dims: [list.length, 768] };
        };
        return extractor;
      },
    });
    await e.embed(['hello']);
    expect(captured.revision).toBe('v1.2.3');
  });
});
