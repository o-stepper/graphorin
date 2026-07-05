import { describe, expect, it } from 'vitest';
import {
  addModelUsage,
  aggregateUsageFromByModel,
  createInitialRunState,
  deserializeRunState,
  RUN_STATE_SCHEMA_VERSION,
  RunStateMalformedError,
  RunStateVersionUnsupportedError,
  runStateFromJSON,
  runStateToJSON,
} from '../src/index.js';

describe('createInitialRunState', () => {
  it('produces a fresh, zeroed RunState', () => {
    const state = createInitialRunState({ id: 'run-1', agentId: 'a-1', sessionId: 's-1' });
    expect(state.id).toBe('run-1');
    expect(state.status).toBe('running');
    expect(state.steps).toEqual([]);
    expect(state.usage.totalTokens).toBe(0);
  });
});

describe('runStateToJSON / runStateFromJSON', () => {
  it('pins the current schema version to 1.2', () => {
    expect(RUN_STATE_SCHEMA_VERSION).toBe('graphorin-run-state/1.2');
  });

  it('W-004: a multimodal run survives serialize -> JSON -> deserialize byte-for-byte', () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255]);
    const base = createInitialRunState({ id: 'run-mm', agentId: 'a-1', sessionId: 's-1' });
    const original = {
      ...base,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'image' as const, image: bytes, mimeType: 'image/png' },
            {
              type: 'file' as const,
              file: new URL('https://example.com/spec.pdf'),
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      steps: [
        {
          stepNumber: 1,
          startedAt: 'now',
          agentId: 'a-1',
          toolCalls: [
            {
              call: { toolCallId: 'tc-1', toolName: 'render', args: {} },
              outcome: {
                toolCallId: 'tc-1',
                toolName: 'render',
                output: 'ok',
                durationMs: 3,
                contentParts: [{ type: 'image' as const, image: bytes, mimeType: 'image/png' }],
              },
              stepNumber: 1,
            },
          ],
        },
      ],
    };
    const round = runStateFromJSON(runStateToJSON(original));
    const message = round.messages[0] as { content: readonly { type: string }[] };
    const image = message.content[0] as unknown as { image: Uint8Array };
    const file = message.content[1] as unknown as { file: URL };
    expect(image.image).toBeInstanceOf(Uint8Array);
    expect(image.image).toEqual(bytes);
    expect(file.file).toBeInstanceOf(URL);
    expect(file.file.href).toBe('https://example.com/spec.pdf');
    const outcome = round.steps[0]?.toolCalls[0]?.outcome as {
      contentParts: readonly { image: Uint8Array }[];
    };
    expect(outcome.contentParts[0]?.image).toBeInstanceOf(Uint8Array);
    expect(outcome.contentParts[0]?.image).toEqual(bytes);
  });

  it('W-004: repairs a legacy 1.1 payload whose bytes were stringify-corrupted', () => {
    const legacy = JSON.stringify({
      version: 'graphorin-run-state/1.1',
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [
        {
          role: 'user',
          // JSON.stringify(new Uint8Array([1, 2, 3])) shape.
          content: [{ type: 'image', image: { '0': 1, '1': 2, '2': 3 } }],
        },
      ],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: 'now',
    });
    const round = runStateFromJSON(legacy);
    const message = round.messages[0] as { content: readonly { image: unknown }[] };
    expect(message.content[0]?.image).toBeInstanceOf(Uint8Array);
    expect(message.content[0]?.image).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('still reads 1.0 payloads', () => {
    const old = JSON.stringify({
      version: 'graphorin-run-state/1.0',
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: 'now',
    });
    expect(runStateFromJSON(old).id).toBe('r');
  });

  it('round-trips an empty fresh state', () => {
    const original = createInitialRunState({
      id: 'run-1',
      agentId: 'a-1',
      sessionId: 's-1',
      userId: 'u-1',
    });
    const serialized = runStateToJSON(original);
    const round = runStateFromJSON(serialized);
    expect(round.id).toBe('run-1');
    expect(round.userId).toBe('u-1');
    expect(round.usage.totalTokens).toBe(0);
  });

  it('rejects future-major versions', () => {
    const tooNew = JSON.stringify({
      version: 'graphorin-run-state/9.0',
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      startedAt: 'now',
    });
    expect(() => runStateFromJSON(tooNew)).toThrowError(RunStateVersionUnsupportedError);
  });

  it('rejects malformed JSON', () => {
    expect(() => runStateFromJSON('{')).toThrowError(RunStateMalformedError);
  });

  it('rejects payloads missing the version field', () => {
    expect(() => deserializeRunState({})).toThrowError(RunStateMalformedError);
  });

  it('synthesizes usageByModel from a v0.1-alpha-style state', () => {
    const alpha = {
      version: RUN_STATE_SCHEMA_VERSION,
      id: 'r',
      agentId: 'a',
      currentAgentId: 'a',
      sessionId: 's',
      status: 'running',
      steps: [],
      messages: [],
      pendingApprovals: [],
      handoffs: [],
      usage: { promptTokens: 5, completionTokens: 7, totalTokens: 12 },
      startedAt: 'now',
    };
    const r = deserializeRunState(alpha);
    expect(r.usageByModel?.a).toBeDefined();
    expect(r.usageByModel?.a?.totalTokens).toBe(12);
    expect(r.usageByModel?.a?.attemptCount).toBe(1);
  });
});

describe('addModelUsage / aggregateUsageFromByModel', () => {
  it('accumulates entries per model with attemptCount', () => {
    const state = createInitialRunState({ id: 'r', agentId: 'a', sessionId: 's' });
    addModelUsage(state, 'haiku-4.5', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    addModelUsage(state, 'haiku-4.5', { promptTokens: 4, completionTokens: 5, totalTokens: 9 });
    expect(state.usageByModel?.['haiku-4.5']?.attemptCount).toBe(2);
    expect(state.usageByModel?.['haiku-4.5']?.totalTokens).toBe(12);
  });

  it('aggregateUsageFromByModel sums across models', () => {
    const state = createInitialRunState({ id: 'r', agentId: 'a', sessionId: 's' });
    addModelUsage(state, 'sonnet', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    addModelUsage(state, 'haiku', { promptTokens: 1, completionTokens: 2, totalTokens: 3 });
    const sum = aggregateUsageFromByModel(state.usageByModel);
    expect(sum.totalTokens).toBe(6);
  });
});
