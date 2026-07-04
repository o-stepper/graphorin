import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createOllamaEmbedder,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  KNOWN_OLLAMA_MODEL_DIMS,
  OllamaEmbedder,
  OllamaEmbedderError,
  VERSION,
} from '../src/index.js';

interface FetchSpec {
  /** URL substring that triggers the response. */
  readonly when: string;
  /** Body passed back to the embedder. */
  readonly body: unknown;
  /** HTTP status. Default 200. */
  readonly status?: number;
}

/**
 * Build a fake `fetch` that responds based on the URL substring it
 * matches. Each call records its arguments so tests can assert on
 * the exact request sequence.
 */
function makeFakeFetch(responses: readonly FetchSpec[]): {
  readonly fetch: typeof fetch;
  readonly calls: ReadonlyArray<{ url: string; body: string }>;
} {
  const calls: { url: string; body: string }[] = [];
  // Sort fixtures by path length descending so longer (more specific)
  // suffixes win over shorter prefixes.
  const sorted = [...responses].sort((a, b) => b.when.length - a.when.length);
  const f: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body;
    const bodyStr = typeof body === 'string' ? body : '';
    calls.push({ url, body: bodyStr });
    const match = sorted.find((r) => url.endsWith(r.when));
    if (!match) {
      return new Response(JSON.stringify({ error: 'no fixture' }), { status: 404 });
    }
    return new Response(JSON.stringify(match.body), {
      status: match.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch: f, calls };
}

const FOUR_FAMILY_FIXTURES = [
  { model: 'nomic-embed-text', dim: 768 },
  { model: 'mxbai-embed-large', dim: 1024 },
  { model: 'snowflake-arctic-embed', dim: 1024 },
  { model: 'bge-m3', dim: 1024 },
];

describe('createOllamaEmbedder', () => {
  it('exports the canonical defaults + version constant', () => {
    expect(VERSION).toBe('0.5.0');
    expect(DEFAULT_OLLAMA_BASE_URL).toBe('http://127.0.0.1:11434');
    expect(DEFAULT_OLLAMA_MODEL).toBe('nomic-embed-text');
    expect(KNOWN_OLLAMA_MODEL_DIMS.get('nomic-embed-text')).toBe(768);
  });

  it('dim()/id() throw for an unknown model with no dim hint instead of baking 0 (PS-11)', () => {
    const e = createOllamaEmbedder({ model: 'totally-unknown-embed', skipDigestProbe: true });
    expect(() => e.dim()).toThrow(/dim/i);
    expect(() => e.id()).toThrow(/dim/i);
  });

  it('honours an explicit dim for an unknown model (PS-11)', () => {
    const e = createOllamaEmbedder({
      model: 'totally-unknown-embed',
      dim: 512,
      skipDigestProbe: true,
    });
    expect(e.dim()).toBe(512);
    expect(e.id()).toContain('@512');
  });

  it('knows the newer embedding families (PS-11)', () => {
    expect(KNOWN_OLLAMA_MODEL_DIMS.get('embeddinggemma')).toBe(768);
    expect(KNOWN_OLLAMA_MODEL_DIMS.get('all-minilm')).toBe(384);
  });

  it('embed() roundtrips through /api/embed (batch path)', async () => {
    const dim = 8;
    const { fetch: fetchImpl, calls } = makeFakeFetch([
      { when: '/api/show', body: { digest: 'sha256:deadbeef0001' } },
      {
        when: '/api/embed',
        body: {
          embeddings: [
            Array.from({ length: dim }, (_, i) => i * 0.1),
            Array.from({ length: dim }, (_, i) => i * 0.2),
          ],
        },
      },
    ]);
    const e = createOllamaEmbedder({
      model: 'unknown-tiny-model',
      fetchImpl,
    });
    const out = await e.embed(['hello', 'world']);
    expect(out.length).toBe(2);
    expect(out[0]?.length).toBe(dim);
    expect(e.id()).toContain('unknown-tiny-model@8');
    expect(e.id()).toContain('sha256:deadb');
    expect(calls[0]?.url).toMatch(/\/api\/show$/);
    expect(calls[1]?.url).toMatch(/\/api\/embed$/);
  });

  it('falls back to legacy /api/embeddings on 404', async () => {
    const dim = 4;
    const { fetch: fetchImpl } = makeFakeFetch([
      { when: '/api/show', body: { digest: 'd1' } },
      { when: '/api/embed', body: {}, status: 404 },
      { when: '/api/embeddings', body: { embedding: [0.1, 0.2, 0.3, 0.4] } },
    ]);
    const e = createOllamaEmbedder({
      model: 'unknown-legacy-model',
      fetchImpl,
    });
    const out = await e.embed(['x']);
    expect(out.length).toBe(1);
    expect(out[0]?.length).toBe(dim);
  });

  it('embed of empty array short-circuits without HTTP calls', async () => {
    let invoked = 0;
    const fakeFetch: typeof fetch = async () => {
      invoked++;
      return new Response('{}', { status: 200 });
    };
    const e = createOllamaEmbedder({ fetchImpl: fakeFetch });
    expect(await e.embed([])).toEqual([]);
    expect(invoked).toBe(0);
  });

  it('configHash includes the digest so a model upgrade flips the hash', () => {
    const a = new OllamaEmbedder({
      model: 'nomic-embed-text',
      digest: 'sha256:aaaa',
      skipDigestProbe: true,
    });
    const b = new OllamaEmbedder({
      model: 'nomic-embed-text',
      digest: 'sha256:bbbb',
      skipDigestProbe: true,
    });
    expect(a.configHash()).not.toBe(b.configHash());
  });

  it('configHash is deterministic for identical config', () => {
    const opts = {
      model: 'nomic-embed-text',
      digest: 'sha256:aaaa',
      skipDigestProbe: true,
    } as const;
    expect(new OllamaEmbedder(opts).configHash()).toBe(new OllamaEmbedder(opts).configHash());
  });

  it('rejects /api/show errors with OllamaEmbedderError', async () => {
    const fakeFetch: typeof fetch = async () => new Response('not found', { status: 404 });
    const e = createOllamaEmbedder({ fetchImpl: fakeFetch });
    await expect(e.embed(['x'])).rejects.toBeInstanceOf(OllamaEmbedderError);
  });

  it('a transient probe failure does not poison subsequent embed calls', async () => {
    let firstCall = true;
    const dim = 4;
    const fakeFetch: typeof fetch = async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith('/api/show')) {
        if (firstCall) {
          firstCall = false;
          return new Response('boom', { status: 500 });
        }
        return new Response(JSON.stringify({ digest: 'sha256:ok' }), { status: 200 });
      }
      if (url.endsWith('/api/embed')) {
        return new Response(
          JSON.stringify({ embeddings: [Array.from({ length: dim }, () => 0.1)] }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    };
    const e = createOllamaEmbedder({ model: 'unknown-model', fetchImpl: fakeFetch });
    await expect(e.embed(['hello'])).rejects.toBeInstanceOf(OllamaEmbedderError);
    const out = await e.embed(['hello']);
    expect(out[0]?.length).toBe(dim);
  });

  it('first embed resolves dim from the response when the model is unknown', async () => {
    const { fetch: fetchImpl } = makeFakeFetch([
      { when: '/api/show', body: { digest: 'sha256:dim-resolve' } },
      {
        when: '/api/embed',
        body: { embeddings: [Array.from({ length: 17 }, () => 0.5)] },
      },
    ]);
    const e = createOllamaEmbedder({ model: 'novel-model', fetchImpl });
    expect(() => e.dim()).toThrow(/dim/i); // PS-11: unknown ⇒ loud, not 0
    const out = await e.embed(['hello']);
    expect(out[0]?.length).toBe(17);
    expect(e.dim()).toBe(17); // resolved from the response width
  });

  it('concurrent embed() calls share a single /api/show probe', async () => {
    let probeCalls = 0;
    const dim = 4;
    const fakeFetch: typeof fetch = async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith('/api/show')) {
        probeCalls++;
        await new Promise((r) => setTimeout(r, 5));
        return new Response(JSON.stringify({ digest: 'sha256:once' }), { status: 200 });
      }
      if (url.endsWith('/api/embed')) {
        return new Response(
          JSON.stringify({ embeddings: [Array.from({ length: dim }, () => 0.1)] }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    };
    const e = createOllamaEmbedder({ model: 'unknown-model', fetchImpl: fakeFetch });
    await Promise.all([e.embed(['a']), e.embed(['b']), e.embed(['c'])]);
    expect(probeCalls).toBe(1);
  });

  it('rejects malformed /api/embed responses', async () => {
    const { fetch: fetchImpl } = makeFakeFetch([
      { when: '/api/show', body: { digest: 'd1' } },
      { when: '/api/embed', body: { embeddings: [] } },
    ]);
    const e = createOllamaEmbedder({ fetchImpl, model: 'nomic-embed-text' });
    await expect(e.embed(['hello'])).rejects.toThrow(/unexpected shape/);
  });

  it('rejects dim drift inside a batched response', async () => {
    const { fetch: fetchImpl } = makeFakeFetch([
      { when: '/api/show', body: { digest: 'd1' } },
      {
        when: '/api/embed',
        body: {
          embeddings: [
            [0.1, 0.2, 0.3, 0.4],
            [0.1, 0.2, 0.3],
          ],
        },
      },
    ]);
    const e = createOllamaEmbedder({ fetchImpl, model: 'mxbai-embed-large', dim: 4 });
    await expect(e.embed(['a', 'b'])).rejects.toThrow(/dim drifted/);
  });

  for (const fixture of FOUR_FAMILY_FIXTURES) {
    it(`works for the ${fixture.model} model family (${fixture.dim}-dim)`, async () => {
      const { fetch: fetchImpl } = makeFakeFetch([
        { when: '/api/show', body: { digest: `sha256:${fixture.model}-1` } },
        {
          when: '/api/embed',
          body: {
            embeddings: [Array.from({ length: fixture.dim }, () => 0.5)],
          },
        },
      ]);
      const e = createOllamaEmbedder({
        model: fixture.model,
        fetchImpl,
      });
      const out = await e.embed(['hi']);
      expect(out[0]?.length).toBe(fixture.dim);
      expect(e.id()).toContain(`${fixture.model}@${fixture.dim}`);
      // The id includes the first 12 chars of the digest.
      expect(e.id()).toContain(`sha256:${fixture.model}-1`.slice(0, 12));
    });
  }
});

// The two integration tests below open real sqlite stores on disk; the
// windows-latest CI runner routinely needs >5s for that (observed 4.4-5s+),
// so they carry an explicit 20s timeout instead of the 5s default.
describe('lock-on-first integration with @graphorin/store-sqlite', () => {
  it('per-model embedder_id is distinct for each Ollama family', { timeout: 20_000 }, async () => {
    // Use mkdtemp to keep the test self-contained; we import store-sqlite
    // dynamically because it's a sibling workspace package.
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-ollama-lock-'));
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      embedderPolicy: 'multi-active',
      skipSqliteVec: true,
    });
    await store.init();
    const fixtures = FOUR_FAMILY_FIXTURES.map((f) => ({
      ...f,
      digest: `sha256:${f.model}-1`,
    }));
    const ids = new Set<string>();
    for (const fixture of fixtures) {
      const e = new OllamaEmbedder({
        model: fixture.model,
        digest: fixture.digest,
        dim: fixture.dim,
        skipDigestProbe: true,
      });
      const meta = store.embeddings.registerOrReturn({
        id: e.id(),
        embedderKind: 'ollama',
        model: fixture.model,
        dim: fixture.dim,
        configHash: e.configHash(),
      });
      ids.add(meta.id);
    }
    expect(ids.size).toBe(fixtures.length);
    await store.close();
  });

  it('lock-on-first rejects a second incompatible Ollama embedder', {
    timeout: 20_000,
  }, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-ollama-lock2-'));
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    await store.init();
    const first = new OllamaEmbedder({
      model: 'nomic-embed-text',
      digest: 'sha256:first',
      dim: 768,
      skipDigestProbe: true,
    });
    store.embeddings.registerOrReturn({
      id: first.id(),
      embedderKind: 'ollama',
      model: 'nomic-embed-text',
      dim: 768,
      configHash: first.configHash(),
    });

    const second = new OllamaEmbedder({
      model: 'bge-m3',
      digest: 'sha256:second',
      dim: 1024,
      skipDigestProbe: true,
    });
    expect(() =>
      store.embeddings.registerOrReturn({
        id: second.id(),
        embedderKind: 'ollama',
        model: 'bge-m3',
        dim: 1024,
        configHash: second.configHash(),
      }),
    ).toThrow(/lock-on-first/);
    await store.close();
  });
});
