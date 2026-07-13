/**
 * Wave-D D2 - profile-projection pass: pure helpers (parse / render /
 * request) + deep-phase e2e over the in-memory store, pinning the
 * sourcing rule (active only, no quarantined, no pending-supersede),
 * deterministic regeneration, the read-only block contract and the
 * user-scoped write + erasure path.
 */

import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  buildProfileProjectionRequest,
  PROFILE_BLOCK_LABEL,
  parseProfileSlots,
  renderProfileBlock,
  resolveProfileProjectionConfig,
} from '../src/consolidator/phases/profile-projection.js';
import { WorkingBlockReadOnlyError } from '../src/errors/index.js';
import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'user-1', sessionId: 'sess-1', agentId: 'agent-1' } as const;
const USER_SCOPE = { userId: 'user-1' } as const;

const CONFIG = resolveProfileProjectionConfig({
  topics: ['identity', 'preferences'],
  maxSlots: 4,
  maxChars: 400,
});

describe('profile-projection pure helpers', () => {
  it('parseProfileSlots validates topics, sources and caps slots', () => {
    const known = new Set(['f1', 'f2']);
    const raw = JSON.stringify({
      slots: [
        { topic: 'identity', sub_topic: 'name', content: 'Alex', sources: ['f1'] },
        { topic: 'astrology', content: 'Leo', sources: ['f1'] }, // foreign topic
        { topic: 'preferences', content: 'Evening sessions', sources: ['f9'] }, // hallucinated source
        { topic: 'preferences', content: 'Tea over coffee', sources: ['f2', 'f9'] },
        { topic: 'identity', content: '', sources: ['f1'] }, // empty content
      ],
    });
    const slots = parseProfileSlots(raw, { knownFactIds: known, config: CONFIG });
    expect(slots).toEqual([
      { topic: 'identity', subTopic: 'name', content: 'Alex', sources: ['f1'] },
      { topic: 'preferences', content: 'Tea over coffee', sources: ['f2'] },
    ]);
  });

  it('parseProfileSlots strips code fences, returns null on junk, caps at maxSlots', () => {
    expect(parseProfileSlots('not json', { knownFactIds: new Set(), config: CONFIG })).toBeNull();
    expect(
      parseProfileSlots('{"nope": []}', { knownFactIds: new Set(), config: CONFIG }),
    ).toBeNull();
    const fenced = '```json\n{"slots": [{"topic":"identity","content":"x","sources":["f1"]}]}\n```';
    expect(
      parseProfileSlots(fenced, { knownFactIds: new Set(['f1']), config: CONFIG }),
    ).toHaveLength(1);
    const many = JSON.stringify({
      slots: Array.from({ length: 10 }, (_, i) => ({
        topic: 'identity',
        content: `c${i}`,
        sources: ['f1'],
      })),
    });
    expect(parseProfileSlots(many, { knownFactIds: new Set(['f1']), config: CONFIG })).toHaveLength(
      CONFIG.maxSlots,
    );
  });

  it('renderProfileBlock is deterministic: taxonomy order, alpha sub-topics, provenance ids', () => {
    const slots = [
      { topic: 'preferences', content: 'Tea over coffee', sources: ['f2'] },
      { topic: 'identity', subTopic: 'name', content: 'Alex', sources: ['f1', 'f3'] },
      { topic: 'identity', subTopic: 'city', content: 'Kyiv', sources: ['f3'] },
    ];
    const rendered = renderProfileBlock(slots, CONFIG);
    expect(rendered).toBe(
      [
        'identity:',
        '- city: Kyiv [f3]',
        '- name: Alex [f1, f3]',
        'preferences:',
        '- Tea over coffee [f2]',
      ].join('\n'),
    );
    // Same input -> same output (and clamped to maxChars).
    expect(renderProfileBlock(slots, CONFIG)).toBe(rendered);
    expect(renderProfileBlock([], CONFIG)).toBe('');
  });

  it('buildProfileProjectionRequest carries taxonomy, previous block and fact ids', () => {
    const req = buildProfileProjectionRequest({
      previous: 'identity:\n- name: Alex [f1]',
      facts: [
        { id: 'f1', text: 'Name is Alex' },
        { id: 'f2', text: 'Prefers tea' },
      ],
      config: CONFIG,
    });
    const content = String(req.messages[0]?.content ?? '');
    expect(req.systemMessage).toContain('profile block');
    expect(content).toContain('Allowed topics (use ONLY these): identity, preferences');
    expect(content).toContain('Previous profile block:');
    expect(content).toContain('- [f1] Name is Alex');
    expect(req.temperature).toBe(0);
  });
});

function profileProvider(
  slotsFor: (factIds: ReadonlyArray<string>) => unknown,
): Provider & { readonly calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fixture-profile',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 32_000,
      maxOutput: 4_000,
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const sys = req.systemMessage ?? '';
      if (sys.includes('profile block')) {
        const content = String(req.messages[0]?.content ?? '');
        const ids = [...content.matchAll(/- \[([^\]]+)\]/g)].map((m) => m[1] as string);
        return {
          text: JSON.stringify(slotsFor(ids)),
          usage: { promptTokens: 20, completionTokens: 12, totalTokens: 32 },
          finishReason: 'stop',
        };
      }
      return {
        text: JSON.stringify({ decision: 'admit', reason: 'n/a' }),
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
        finishReason: 'stop',
      };
    },
    stream: () => {
      throw new Error('not implemented');
    },
    get calls() {
      return calls;
    },
  };
}

async function setupProfile(args: {
  profile?: Parameters<typeof createMemory>[0]['profile'];
  slotsFor?: (factIds: ReadonlyArray<string>) => unknown;
}): Promise<{
  memory: ReturnType<typeof createMemory>;
  provider: ReturnType<typeof profileProvider>;
}> {
  const provider = profileProvider(
    args.slotsFor ??
      ((ids) => ({
        slots: ids.map((id, index) => ({
          topic: 'identity',
          content: `fact-${index}`,
          sources: [id],
        })),
      })),
  );
  const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
  const memory = createMemory({
    store,
    embeddings: new InMemoryEmbeddingRegistry(),
    ...(args.profile !== undefined ? { profile: args.profile } : {}),
    consolidator: {
      tier: 'full',
      provider,
      defaultScope: SCOPE,
      reflection: false,
    },
  });
  await memory.consolidator.start();
  return { memory, provider };
}

describe('consolidator deep phase - profile projection (wave-D D2)', () => {
  it('projects only active facts: quarantined and pending-supersede excluded', async () => {
    const { memory, provider } = await setupProfile({
      profile: { topics: ['identity'], maxChars: 500 },
    });
    // Plain active fact (user provenance defaults to active).
    await memory.semantic.remember(SCOPE, { text: 'Name is Alex' });
    // Quarantined fact (synthesized provenance, no auto-promote).
    await memory.semantic.remember(SCOPE, {
      text: 'Probably owns a yacht',
      provenance: 'extraction',
    });
    // Pending supersede: old stays active-but-contested, successor quarantined.
    const oldFact = await memory.semantic.remember(SCOPE, { text: 'Lives in Berlin' });
    await memory.semantic.supersede(SCOPE, oldFact.id, {
      text: 'Lives in Kyiv',
      provenance: 'extraction',
    });

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.profileProjectionUpdated).toBe(true);

    const projectionCall = provider.calls.find((r) =>
      (r.systemMessage ?? '').includes('profile block'),
    );
    const promptContent = String(projectionCall?.messages[0]?.content ?? '');
    expect(promptContent).toContain('Name is Alex');
    expect(promptContent).not.toContain('yacht'); // quarantined
    expect(promptContent).not.toContain('Berlin'); // pending supersede (contested)
    expect(promptContent).not.toContain('Kyiv'); // quarantined successor
  });

  it('writes a user-scoped read-only block; deterministic regeneration; agent writes refused', async () => {
    const { memory } = await setupProfile({ profile: {} });
    await memory.semantic.remember(SCOPE, { text: 'Name is Alex' });

    const first = await memory.consolidator.fireNow('deep', SCOPE);
    expect(first?.profileProjectionUpdated).toBe(true);
    // The block is USER-scoped: readable at the bare user scope, not
    // materialised under the firing session scope.
    const value = await memory.working.read(USER_SCOPE, PROFILE_BLOCK_LABEL);
    expect(value).toContain('identity:');
    expect(value).toContain('fact-0');

    // Same facts + same scripted reply -> identical content, no rewrite.
    const second = await memory.consolidator.fireNow('deep', SCOPE);
    expect(second?.profileProjectionUpdated).toBe(false);
    expect(await memory.working.read(USER_SCOPE, PROFILE_BLOCK_LABEL)).toBe(value);

    // Consolidator-owned: the agent-facing mutate path refuses.
    await expect(memory.working.write(USER_SCOPE, PROFILE_BLOCK_LABEL, 'hack')).rejects.toThrow(
      WorkingBlockReadOnlyError,
    );

    // Erasure path: hard purge removes the user-scoped block.
    await memory.working.purge(USER_SCOPE, PROFILE_BLOCK_LABEL);
    expect(await memory.working.read(USER_SCOPE, PROFILE_BLOCK_LABEL)).toBeNull();
  });

  it('stays inert without profile config and skips gracefully with no facts', async () => {
    const inert = await setupProfile({});
    await inert.memory.semantic.remember(SCOPE, { text: 'Name is Alex' });
    const outcome = await inert.memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.profileProjectionUpdated).toBeUndefined();
    expect(await inert.memory.working.read(USER_SCOPE, PROFILE_BLOCK_LABEL)).toBeNull();

    const empty = await setupProfile({ profile: {} });
    const emptyOutcome = await empty.memory.consolidator.fireNow('deep', SCOPE);
    expect(emptyOutcome?.profileProjectionUpdated).toBe(false);
    expect(empty.provider.calls.length).toBe(0);
  });

  it('session-scoped variant writes under the firing scope', async () => {
    const { memory } = await setupProfile({ profile: { scope: 'session' } });
    await memory.semantic.remember(SCOPE, { text: 'Name is Alex' });
    await memory.consolidator.fireNow('deep', SCOPE);
    expect(await memory.working.read(SCOPE, PROFILE_BLOCK_LABEL)).toContain('identity:');
    expect(await memory.working.read(USER_SCOPE, PROFILE_BLOCK_LABEL)).toBeNull();
  });
});
