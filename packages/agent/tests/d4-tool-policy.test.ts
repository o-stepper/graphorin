/**
 * D4 end-to-end: the Progent tool-argument policy and Rule-of-Two
 * capability preset enforced through the agent's tool executor.
 */

import type { Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function tool(
  name: string,
  sideEffectClass: 'read-only' | 'side-effecting' | 'external-stateful',
  state: { ran: boolean },
  sensitivity?: 'secret',
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass,
    ...(sensitivity !== undefined ? { sensitivity } : {}),
    execute: async () => {
      state.ran = true;
      return 'ok';
    },
  } as Tool<unknown, unknown, unknown>;
}

function provider(scripts: ReadonlyArray<MockProviderScript>): Provider {
  let cursor = 0;
  return {
    name: 'mock',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8192,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate() {
      throw new Error('mock: generate not implemented');
    },
  };
}

describe('D4 — Progent tool-argument policy', () => {
  it('forbids a matching tool at the executor with capability_blocked', async () => {
    const ran = { ran: false };
    const agent = createAgent({
      name: 'policed',
      instructions: 'do things',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'delete_bucket', args: { name: 'prod' } }),
        textOnlyScript('done'),
      ]),
      tools: [tool('delete_bucket', 'external-stateful', ran)],
      toolPolicy: {
        rules: [{ effect: 'forbid', tool: 'delete_*', reason: 'destructive ops disabled' }],
      },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(ran.ran).toBe(false);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
    expect(outcome !== undefined && 'message' in outcome ? outcome.message : '').toContain(
      'destructive ops disabled',
    );
  });

  it('allows a non-matching call', async () => {
    const ran = { ran: false };
    const agent = createAgent({
      name: 'policed',
      instructions: 'do things',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'read_file', args: {} }),
        textOnlyScript('done'),
      ]),
      tools: [tool('read_file', 'read-only', ran)],
      toolPolicy: { rules: [{ effect: 'forbid', tool: 'delete_*' }] },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(ran.ran).toBe(true);
  });
});

describe('D4 — Rule-of-Two capability preset', () => {
  it('denying external side effects blocks writer tools and forces read-only', async () => {
    const wrote = { ran: false };
    const agent = createAgent({
      name: 'rot',
      instructions: 'browse and act',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'send_email', args: {} }),
        textOnlyScript('done'),
      ]),
      tools: [tool('send_email', 'external-stateful', wrote)],
      // Holds untrusted input + sensitive data, drops the third leg.
      ruleOfTwo: { untrustedInput: true, sensitiveData: true, externalSideEffects: false },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(wrote.ran).toBe(false);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    // Either the capability floor (advertise + executor gate) or the
    // Progent writer-forbid blocks it — both surface capability_blocked.
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
  });

  it('denying sensitive data default-denies a secret-tier tool', async () => {
    const readSecret = { ran: false };
    const agent = createAgent({
      name: 'rot2',
      instructions: 'read and send',
      provider: provider([
        toolCallScript({ toolCallId: 'c1', toolName: 'read_secret', args: {} }),
        textOnlyScript('done'),
      ]),
      tools: [tool('read_secret', 'read-only', readSecret, 'secret')],
      ruleOfTwo: { untrustedInput: true, sensitiveData: false, externalSideEffects: true },
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(readSecret.ran).toBe(false);
    const outcome = result.state.steps.flatMap((s) => s.toolCalls)[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
  });
});
