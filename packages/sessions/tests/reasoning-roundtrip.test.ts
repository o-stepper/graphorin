import type { AssistantMessage, ReasoningContent, TextContent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createBufferSink, createSessionManager } from '../src/index.js';
import { InMemoryMemorySessionFacade, InMemorySessionStore } from './fixtures/in-memory-stores.js';

const fixedNow = (): number => Date.parse('2026-05-08T10:00:00Z');
let __id = 0;
const idFactory = (prefix: string): string => {
  __id += 1;
  return `${prefix}-${String(__id).padStart(4, '0')}`;
};

function setup() {
  __id = 0;
  const store = new InMemorySessionStore();
  const memory = new InMemoryMemorySessionFacade(fixedNow);
  const manager = createSessionManager({ store, memory, now: fixedNow, newId: idFactory });
  return { store, memory, manager };
}

describe('Reasoning content retention', () => {
  it('round-trips Anthropic-shaped reasoning + opaque meta bytes-equal through Session.push / list', async () => {
    const { manager, memory } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const reasoning: ReasoningContent = {
      type: 'reasoning',
      text: 'Let me think about this step by step...',
      meta: {
        provider: 'anthropic',
        signature: 'opaque-sig-abc123',
        data: 'opaque-data-xyz',
      },
    };
    const text: TextContent = { type: 'text', text: 'Sure, I can help.' };
    const msg: AssistantMessage = {
      role: 'assistant',
      content: [reasoning, text],
      agentId: 'main',
    };
    await session.push(msg);
    const stored = memory.messages[0]?.message as AssistantMessage;
    expect(stored.content).toEqual([reasoning, text]);
    const listed = await session.list({});
    expect(listed[0]).toEqual(msg);
  });

  it('preserves reasoning content + opaque meta through JSONL export → import', async () => {
    const sourceA = setup();
    const session = await sourceA.manager.create({ userId: 'u-1', agentId: 'main' });
    const reasoning: ReasoningContent = {
      type: 'reasoning',
      text: 'Internal chain of thought.',
      meta: {
        provider: 'anthropic',
        signature: 'opaque-sig-abc',
        data: 'opaque-data-xyz',
      },
    };
    const msg: AssistantMessage = {
      role: 'assistant',
      content: [reasoning, { type: 'text', text: 'Sure!' }],
      agentId: 'main',
    };
    await session.push(msg);
    const buffer = createBufferSink();
    await session.export({ sink: buffer.sink });

    const sourceB = setup();
    const result = await sourceB.manager.importFromString(buffer.toString());
    expect(result.session).not.toBeNull();
    const reimported = sourceB.memory.messages[0]?.message;
    expect(reimported?.role).toBe('assistant');
    if (reimported?.role === 'assistant' && Array.isArray(reimported.content)) {
      const reimportedReasoning = reimported.content.find((p) => p.type === 'reasoning');
      expect(reimportedReasoning).toBeDefined();
      if (reimportedReasoning?.type === 'reasoning') {
        expect(reimportedReasoning.text).toBe(reasoning.text);
        expect(reimportedReasoning.meta).toEqual(reasoning.meta);
      }
    }
  });

  it('does not strip reasoning at any session-output boundary (push / list / export)', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const reasoning: ReasoningContent = {
      type: 'reasoning',
      text: 'Reasoning visible',
      meta: { provider: 'anthropic', signature: 'sig' },
    };
    await session.push({
      role: 'assistant',
      content: [reasoning],
      agentId: 'main',
    });
    const out = await session.list({});
    if (out[0]?.role === 'assistant' && Array.isArray(out[0].content)) {
      const part = out[0].content[0];
      expect(part?.type).toBe('reasoning');
    }
  });
});
