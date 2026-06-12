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

describe('TransformersJsEmbedder', () => {
  it('VERSION constant matches the package version', () => {
    expect(VERSION).toBe('0.4.0');
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
    expect(e.dim()).toBe(768); // default fallback
    await e.embed(['hello']);
    expect(e.dim()).toBe(123);
    expect(e.id()).toBe('transformersjs:unknown-model@123');
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
