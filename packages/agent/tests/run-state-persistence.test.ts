/**
 * AG-23: the suspend checkpoint must persist a DETACHED, SECRET-FREE
 * snapshot. The old code stored a live `MutableRunState` reference
 * (post-suspend mutations leaked into in-memory stores) and
 * `serializeRunState`'s documented `stripTracingApiKey` option was
 * `void options;` - dead.
 */

import type { Checkpoint, CheckpointMetadata, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent, createInitialRunState, serializeRunState } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

function baseState() {
  const state = createInitialRunState({
    id: 'run-1',
    agentId: 'a-1',
    sessionId: 's-1',
  });
  state.steps.push({
    stepNumber: 0,
    startedAt: new Date(1).toISOString(),
    toolCalls: [
      {
        toolCallId: 'tc-1',
        toolName: 'lookup',
        args: { q: 'x' },
        result: { apiKey: 'sk-secret-123', data: 'fine' },
        status: 'success' as const,
        durationMs: 1,
      },
    ],
  } as never);
  return state;
}

describe('AG-23 - serializeRunState is a detached snapshot', () => {
  it('deep-clones: mutations of the source AFTER serializing do not reach the snapshot', () => {
    const state = baseState();
    const snapshot = serializeRunState(state);
    const stepsBefore = snapshot.steps.length;
    const messagesBefore = snapshot.messages.length;

    state.steps.push({ stepNumber: 1, startedAt: new Date(2).toISOString() } as never);
    state.messages.push({ role: 'user', content: 'AFTER-SUSPEND' } as never);

    expect(snapshot.steps.length).toBe(stepsBefore);
    expect(snapshot.messages.length).toBe(messagesBefore);
    expect(JSON.stringify(snapshot)).not.toContain('AFTER-SUSPEND');
  });

  it('stripTracingApiKey redacts secret-named keys anywhere in the snapshot', () => {
    const state = baseState();
    const stripped = serializeRunState(state, { stripTracingApiKey: true });
    const json = JSON.stringify(stripped);
    expect(json).not.toContain('sk-secret-123');
    expect(json).toContain('[redacted]');
    // Non-secret payload survives untouched.
    expect(json).toContain('fine');

    // The plain round-trip helper stays verbatim by default.
    const verbatim = serializeRunState(state);
    expect(JSON.stringify(verbatim)).toContain('sk-secret-123');
  });
});

const lookupTool = (): Tool<unknown, unknown, unknown> =>
  ({
    name: 'lookup',
    description: 'Fetch a record (auto).',
    inputSchema: {
      parse: (v: unknown) => v as { readonly q: string },
      safeParse: (v: unknown) => ({ success: true as const, data: v as { readonly q: string } }),
      toJSON: (): Record<string, unknown> => ({
        type: 'object',
        properties: { q: { type: 'string' } },
      }),
    } as Tool<{ readonly q: string }, unknown, unknown>['inputSchema'],
    sideEffectClass: 'read-only',
    async execute() {
      return { apiKey: 'sk-secret-123', data: 'record-7' };
    },
  }) as unknown as Tool<unknown, unknown, unknown>;

const sendTool = (): Tool<unknown, unknown, unknown> =>
  ({
    name: 'send_email',
    description: 'Send an email (requires approval).',
    inputSchema: {
      parse: (v: unknown) => v as { readonly to: string },
      safeParse: (v: unknown) => ({ success: true as const, data: v as { readonly to: string } }),
      toJSON: (): Record<string, unknown> => ({
        type: 'object',
        properties: { to: { type: 'string' } },
      }),
    } as Tool<{ readonly to: string }, string, unknown>['inputSchema'],
    needsApproval: true,
    sideEffectClass: 'external-stateful',
    async execute(input: { readonly to: string }) {
      return `sent:${input.to}`;
    },
  }) as unknown as Tool<unknown, unknown, unknown>;

describe('AG-23 - the suspend checkpoint is serialized, stripped, and detached', () => {
  it('persists a version-stamped snapshot with secrets redacted; post-suspend mutations stay invisible', async () => {
    const puts: Array<{ checkpoint: Checkpoint; metadata: CheckpointMetadata }> = [];
    const checkpointStore = {
      async put(
        _threadId: string,
        _namespace: string,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
      ) {
        puts.push({ checkpoint, metadata });
      },
      async putWrites() {},
      async getTuple() {
        return null;
      },
      async *list() {},
      async delete() {},
    };

    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-lookup',
          toolName: 'lookup',
          args: { q: 'r7' },
          totalTokens: 8,
        }),
        toolCallScript({
          toolCallId: 'tc-send',
          toolName: 'send_email',
          args: { to: 'a@b.c' },
          totalTokens: 8,
        }),
      ],
    });
    const agent = createAgent({
      name: 'mailer',
      instructions: 'Look up then send.',
      provider,
      tools: [lookupTool(), sendTool()],
      checkpointStore: checkpointStore as never,
    });

    // AG-9: run() resolves with the suspended, LIVE RunState.
    const result = await agent.run('go');
    expect(result.status).toBe('awaiting_approval');

    expect(puts.length).toBeGreaterThan(0);
    const persisted = puts.at(-1)?.checkpoint.state as Record<string, unknown>;

    // (a) Serialized form, not a live MutableRunState reference.
    expect(typeof persisted.version).toBe('string');
    expect(String(persisted.version)).toMatch(/^graphorin-run-state\//);

    // (b) The lookup result's secret never reaches the store.
    const json = JSON.stringify(persisted);
    expect(json).toContain('record-7');
    expect(json).not.toContain('sk-secret-123');

    // (c) Post-suspend mutations of the live run state stay invisible.
    const stepsAtSuspend = (persisted.steps as unknown[]).length;
    const messagesAtSuspend = (persisted.messages as unknown[]).length;
    (result.state.steps as unknown[]).push({ stepNumber: 99 });
    (result.state.messages as unknown[]).push({ role: 'user', content: 'AFTER-SUSPEND' });
    expect((persisted.steps as unknown[]).length).toBe(stepsAtSuspend);
    expect((persisted.messages as unknown[]).length).toBe(messagesAtSuspend);
    expect(JSON.stringify(persisted)).not.toContain('AFTER-SUSPEND');
  });
});

describe('W-005 - checkpointPolicy: thread hygiene on terminal runs', () => {
  function trackingStore() {
    const deleted: string[] = [];
    const store = {
      async put() {},
      async putWrites() {},
      async getTuple() {
        return null;
      },
      async *list() {},
      async delete() {},
      async deleteThread(threadId: string) {
        deleted.push(threadId);
      },
    };
    return { store, deleted };
  }

  it("'delete-on-terminal' deletes the thread after a completed run", async () => {
    const { store, deleted } = trackingStore();
    const agent = createAgent({
      name: 'clean',
      instructions: 'Answer.',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done')] }),
      checkpointStore: store as never,
      checkpointPolicy: 'delete-on-terminal',
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(deleted).toEqual([result.state.id]);
  });

  it("'delete-on-terminal' NEVER deletes an awaiting_approval thread (it IS the resume state)", async () => {
    const { store, deleted } = trackingStore();
    const agent = createAgent({
      name: 'mailer',
      instructions: 'Send.',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-send',
            toolName: 'send_email',
            args: { to: 'a@b.c' },
            totalTokens: 8,
          }),
        ],
      }),
      tools: [sendTool()],
      checkpointStore: store as never,
      checkpointPolicy: 'delete-on-terminal',
    });
    const result = await agent.run('go');
    expect(result.status).toBe('awaiting_approval');
    expect(deleted).toEqual([]);
  });

  it("default 'keep' leaves the thread after a completed run (byte-identical to today)", async () => {
    const { store, deleted } = trackingStore();
    const agent = createAgent({
      name: 'keeper',
      instructions: 'Answer.',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done')] }),
      checkpointStore: store as never,
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(deleted).toEqual([]);
  });
});
