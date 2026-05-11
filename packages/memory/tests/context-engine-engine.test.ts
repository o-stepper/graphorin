import { describe, expect, it } from 'vitest';
import {
  _resetLocaleFallbackWarningsForTesting,
  annotate,
  CONTENT_ORIGIN_ATTR,
  createContextEngine,
  createMemory,
  defineBlock,
  INBOUND_TRUST_ATTR,
  resolveLocalePack,
  shouldFireInboundPreamble,
  toSpanAttributes,
} from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

describe('context-engine — assemble() (Phase 10d)', () => {
  it('assembles all six layers in priority order with content-origin annotations', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 200 })],
      contextEngine: { providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'persona', 'Be friendly.');
    await memory.procedural.define(scope, { text: 'Always greet by name.' });
    const engine = memory.contextEngine;
    const out = await engine.assemble(memory, {
      scope,
      runId: 'run_1',
      sessionId: 's1',
      agentId: 'a1',
      agentInstructions: 'Help the user.',
      skills: [{ name: 'pdf', description: 'PDF processing' }],
      lastUserMessage: 'hello',
    });
    expect(out.systemMessage.content).toContain('<graphorin_memory_base>');
    expect(out.systemMessage.content).toContain('<agent_instructions>');
    expect(out.systemMessage.content).toContain('<memory_blocks>');
    expect(out.systemMessage.content).toContain('<memory_rules>');
    expect(out.systemMessage.content).toContain('<skills_available>');
    expect(out.systemMessage.content).toContain('<memory_metadata>');
    expect(out.localeId).toBe('en');
    expect(out.memoryBaseMode).toBe('full');
    // Each annotated part carries both axes.
    for (const part of out.annotations) {
      const span = toSpanAttributes(part.annotation);
      expect(span[CONTENT_ORIGIN_ATTR]).toBeDefined();
      expect(span[INBOUND_TRUST_ATTR]).toBeDefined();
    }
  });

  it("assembled fixture: 'full' ≥ 600 tokens (with realistic Layer 3-4 content) (DoD bound)", async () => {
    const { HEURISTIC_TOKEN_COUNTER: counter } = await import('../src/index.js');
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 400, sensitivity: 'public' })],
      contextEngine: { memoryBaseMode: 'full', providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(
      scope,
      'persona',
      'Be concise; cite sources; prefer structured output where appropriate.',
    );
    await memory.procedural.define(scope, {
      text: 'Always confirm destructive operations with the user before executing them.',
      priority: 80,
    });
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      agentInstructions: 'Help the user write tests for the framework.',
      skills: [{ name: 'pdf-processing', description: 'Extract text and tables from PDF files' }],
    });
    const tokens = await counter.countText(out.systemMessage.content);
    expect(tokens).toBeGreaterThanOrEqual(600);
  });

  it("assembled fixture: 'minimal' ≤ 200 tokens (empty fixture; DoD bound)", async () => {
    const { HEURISTIC_TOKEN_COUNTER: counter } = await import('../src/index.js');
    // Per the DoD: `memoryBaseMode: 'minimal'` is the opt-in for
    // top-tier models — the bound applies when the operator opts
    // into the compact narrative AND the per-step fixture stays
    // small. With no working blocks / no rules / no skills, the
    // assembled prompt is well under the 200-token ceiling.
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { memoryBaseMode: 'minimal', providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    const tokens = await counter.countText(out.systemMessage.content);
    expect(tokens).toBeLessThanOrEqual(200);
  });

  it("memoryBaseMode: 'minimal' produces a smaller token count than 'full'", async () => {
    const store = createInMemoryStore();
    const fullMemory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { memoryBaseMode: 'full', providerContextWindow: 128_000 },
    });
    const minimalMemory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { memoryBaseMode: 'minimal', providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const fullOut = await fullMemory.contextEngine.assemble(fullMemory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    const minimalOut = await minimalMemory.contextEngine.assemble(minimalMemory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    expect(fullOut.systemMessage.content.length).toBeGreaterThan(
      minimalOut.systemMessage.content.length,
    );
  });

  it('disables a layer when the operator opts out', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        layers: { activeSkills: { enabled: false } },
        providerContextWindow: 128_000,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      skills: [{ name: 'should-not-appear', description: 'x' }],
    });
    expect(out.systemMessage.content).not.toContain('should-not-appear');
  });

  it('per-layer cap truncates the over-budget layer with a marker', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 8000, sensitivity: 'public' })],
      contextEngine: {
        layers: { workingBlocks: { cap: 5 } },
        providerContextWindow: 128_000,
        privacy: { providerTrust: 'public-tls' },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'persona', 'X'.repeat(2000));
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    const wbAlloc = out.layerAllocation.layers.find((l) => l.id === 'workingBlocks');
    expect(wbAlloc?.tokens).toBeLessThanOrEqual(6);
    expect(wbAlloc?.truncated).toBe(true);
  });

  it("drops 'secret' working blocks for a public-tls provider with audit-counter increment", async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'secret-key', charLimit: 80, sensitivity: 'secret' })],
      contextEngine: {
        privacy: {
          providerTrust: 'public-tls',
          providerAcceptsSensitivity: ['public'],
          cloudUploadConsent: true,
        },
        providerContextWindow: 128_000,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'secret-key', 'sk-abcdef');
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    expect(out.systemMessage.content).not.toContain('sk-abcdef');
    expect(out.privacyCounters['provider-rejects-secret']).toBeGreaterThanOrEqual(1);
  });

  it('drops internal working blocks when cloudUploadConsent: false on public-tls', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'profile', charLimit: 80 })], // internal default
      contextEngine: {
        privacy: {
          providerTrust: 'public-tls',
          cloudUploadConsent: false,
        },
        providerContextWindow: 128_000,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'profile', 'name=Olya');
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    expect(out.systemMessage.content).not.toContain('Olya');
    expect(out.privacyCounters['provider-rejects-internal']).toBeGreaterThanOrEqual(1);
  });

  it("'public' content always passes, even on the conservative public-tls default", async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'about', charLimit: 80, sensitivity: 'public' })],
      contextEngine: {
        privacy: { providerTrust: 'public-tls' },
        providerContextWindow: 128_000,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'about', 'hello world');
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    expect(out.systemMessage.content).toContain('hello world');
  });

  it('content-origin annotations carry both axes per assembled part', () => {
    const annotation = annotate('memory:tier-filtered', 'n/a');
    expect(annotation.origin).toBe('memory:tier-filtered');
    expect(annotation.inboundTrust).toBe('n/a');
    const span = toSpanAttributes(annotation);
    expect(span[CONTENT_ORIGIN_ATTR]).toBe('memory:tier-filtered');
    expect(span[INBOUND_TRUST_ATTR]).toBe('n/a');
  });

  it('non-inbound origins are forced to inboundTrust = n/a', () => {
    const annotation = annotate('user:input', 'mcp');
    expect(annotation.inboundTrust).toBe('n/a');
  });

  it('shouldFireInboundPreamble triggers on any non-trusted, non-n/a part', () => {
    expect(
      shouldFireInboundPreamble([
        annotate('memory:tier-filtered', 'n/a'),
        annotate('tool:result', 'mcp'),
      ]),
    ).toBe(true);
    expect(
      shouldFireInboundPreamble([
        annotate('memory:tier-filtered', 'n/a'),
        annotate('tool:result', 'trusted'),
      ]),
    ).toBe(false);
  });

  it('inbound preamble fragment is appended after the cache breakpoint when fired', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      upstreamAnnotations: [annotate('tool:result', 'mcp')],
    });
    expect(out.inboundPreambleFired).toBe(true);
    // Preamble lives at the very end of the assembled prompt — after every other layer.
    expect(out.systemMessage.content).toContain('untrusted_content');
    const inboundIdx = out.systemMessage.content.indexOf('untrusted_content');
    const metadataIdx = out.systemMessage.content.indexOf('<memory_metadata>');
    expect(inboundIdx).toBeGreaterThan(metadataIdx);
  });

  it('inbound preamble does NOT fire when only trusted upstream parts are present', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { providerContextWindow: 128_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      upstreamAnnotations: [annotate('tool:result', 'trusted')],
    });
    expect(out.inboundPreambleFired).toBe(false);
    expect(out.systemMessage.content).not.toContain('untrusted_content');
  });

  it('locale composition produces the English prompt by default; custom pack overrides', async () => {
    // Pre-warm the locale-fallback registry once so the test output stays clean.
    _resetLocaleFallbackWarningsForTesting();
    resolveLocalePack(
      {
        id: 'mock',
        baseTemplate: { full: '<custom_full mode="full"/>', minimal: '<custom_min/>' },
      },
      { silent: true },
    );
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        locale: {
          id: 'mock',
          baseTemplate: { full: '<custom_full mode="full"/>', minimal: '<custom_min/>' },
        },
        providerContextWindow: 128_000,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
    });
    expect(out.localeId).toBe('mock');
    expect(out.systemMessage.content).toContain('<custom_full');
    expect(out.systemMessage.content).not.toContain('<graphorin_memory_base>');
  });

  it('createContextEngine surfaces a resolved configuration snapshot', () => {
    const engine = createContextEngine({
      memoryBaseMode: 'minimal',
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'loopback' },
    });
    const cfg = engine.config();
    expect(cfg.memoryBaseMode).toBe('minimal');
    expect(cfg.localeId).toBe('en');
    expect(cfg.compactionEnabled).toBe(false); // loopback default OFF
    expect(cfg.providerTrust).toBe('loopback');
  });

  it('explicit operator opt-in to compaction overrides the loopback default', () => {
    const engine = createContextEngine({
      providerContextWindow: 32_000,
      privacy: { providerTrust: 'loopback' },
      compaction: { trigger: { thresholdTokens: 27_000 } },
    });
    expect(engine.config().compactionEnabled).toBe(true);
    expect(engine.config().compactionThresholdTokens).toBe(27_000);
  });
});
