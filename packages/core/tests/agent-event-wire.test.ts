import { describe, expect, it } from 'vitest';

import type { AgentEvent, RunState } from '../src/index.js';
import { fromWireAgentEvent, toWireAgentEvent, zeroUsage } from '../src/index.js';

const BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255]);

function multimodalState(): RunState {
  return {
    id: 'run-1',
    agentId: 'a-1',
    currentAgentId: 'a-1',
    sessionId: 's-1',
    status: 'completed',
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
              contentParts: [{ type: 'image', image: BYTES, mimeType: 'image/png' }],
            },
            stepNumber: 1,
          },
        ],
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: BYTES, mimeType: 'image/png' },
          { type: 'file', file: new URL('https://example.com/a.pdf'), mimeType: 'application/pdf' },
        ],
      },
    ],
    pendingApprovals: [],
    handoffs: [],
    usage: zeroUsage(),
    startedAt: 'now',
  };
}

/**
 * The Record type forces a fixture for EVERY AgentEvent variant: adding
 * a variant to the union without extending this fixture (and deciding
 * whether it needs a wire twin) is a compile error. That friction is
 * the point (W-046).
 */
const FIXTURES: Record<AgentEvent['type'], AgentEvent> = {
  'agent.start': { type: 'agent.start', runId: 'r', agentId: 'a' },
  'step.start': { type: 'step.start', stepNumber: 1 },
  'text.delta': { type: 'text.delta', delta: 'hi' },
  'text.complete': { type: 'text.complete', text: 'hi' },
  'reasoning.delta': { type: 'reasoning.delta', delta: 'think' },
  'tool.call.start': { type: 'tool.call.start', toolCallId: 't', toolName: 'n', args: { q: 1 } },
  'tool.call.delta': { type: 'tool.call.delta', toolCallId: 't', argsDelta: '{' },
  'tool.call.end': { type: 'tool.call.end', toolCallId: 't', finalArgs: { q: 1 } },
  'tool.execute.start': { type: 'tool.execute.start', toolCallId: 't' },
  'tool.execute.progress': {
    type: 'tool.execute.progress',
    toolName: 'n',
    toolCallId: 't',
    current: 1,
    total: 2,
    stepNumber: 1,
    ts: 1,
  },
  'tool.execute.partial': {
    type: 'tool.execute.partial',
    toolName: 'n',
    toolCallId: 't',
    chunk: { kind: 'image', data: BYTES, mediaType: 'image/png' },
    chunkIndex: 0,
    stepNumber: 1,
    ts: 1,
  },
  'tool.execute.end': { type: 'tool.execute.end', toolCallId: 't', result: 'ok', durationMs: 1 },
  'tool.execute.error': {
    type: 'tool.execute.error',
    toolCallId: 't',
    error: { toolCallId: 't', toolName: 'n', kind: 'execution_failed', message: 'boom' },
  },
  'tool.approval.requested': { type: 'tool.approval.requested', toolCallId: 't' },
  'tool.approval.granted': { type: 'tool.approval.granted', toolCallId: 't' },
  'tool.approval.denied': { type: 'tool.approval.denied', toolCallId: 't' },
  'context.compacted': {
    type: 'context.compacted',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    beforeTokens: 10,
    afterTokens: 5,
    summaryTokens: 2,
    durationMs: 1,
    source: 'auto-trigger',
    hooksFiredCount: 0,
  },
  handoff: { type: 'handoff', fromAgentId: 'a', toAgentId: 'b' },
  'agent.steered': { type: 'agent.steered', runId: 'r' },
  'agent.followup.queued': { type: 'agent.followup.queued', runId: 'r' },
  'agent.cancelling': {
    type: 'agent.cancelling',
    runId: 'r',
    drain: true,
    onPendingApprovals: 'deny',
  },
  'agent.model.fellback': {
    type: 'agent.model.fellback',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    from: 'm1',
    to: 'm2',
    reason: 'rate-limit',
    stepNumber: 1,
    attempt: 1,
  },
  'agent.fanout.spawned': {
    type: 'agent.fanout.spawned',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    fanOutId: 'f',
    childCount: 2,
    mergeStrategyKind: 'concat',
    spawnedAtIso: 'now',
  },
  'agent.fanout.merged': {
    type: 'agent.fanout.merged',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    fanOutId: 'f',
    childCount: 2,
    successfulChildCount: 2,
    mergeStrategyKind: 'concat',
    mergeDurationMs: 1,
    childMetadata: [],
  },
  'agent.evaluator.iteration': {
    type: 'agent.evaluator.iteration',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    iteration: 1,
    score: 0.5,
    pass: false,
    critique: 'try harder',
    durationMs: 1,
  },
  'agent.evaluator.converged': {
    type: 'agent.evaluator.converged',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    totalIterations: 2,
    finalScore: 0.9,
    terminationReason: 'pass',
  },
  'agent.progress.written': {
    type: 'agent.progress.written',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    ref: {
      path: 'p',
      role: 'notes',
      seq: 1,
      sizeBytes: 10,
      sensitivity: 'internal',
      writtenAtIso: 'now',
      sha256: 'x',
    },
  },
  'agent.progress.read': {
    type: 'agent.progress.read',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    refs: [],
    queriedRunId: 'r',
    queriedRole: undefined,
  },
  'agent.lateral-leak.detected': {
    type: 'agent.lateral-leak.detected',
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    vector: 'commentary-phase',
    severity: 'warn',
    causalityChain: [],
    messageContentSha256: 'x',
    decision: 'flag',
    detectedAtIso: 'now',
  },
  'file.generated': { type: 'file.generated', mimeType: 'image/png', data: BYTES },
  'source.cited': { type: 'source.cited', uri: 'https://example.com' },
  'step.end': { type: 'step.end', stepNumber: 1, usage: zeroUsage() },
  'guardrail.tripped': { type: 'guardrail.tripped', guardrailName: 'g', phase: 'input' },
  'verifier.result': { type: 'verifier.result', verifierId: 'v', ok: true, stepNumber: 1 },
  // W-036: the wrapped child event must itself be binary-bearing so
  // this gate proves the RECURSIVE projection.
  'subagent.event': {
    type: 'subagent.event',
    toolCallId: 'h1',
    agentName: 'child',
    event: {
      type: 'agent.end',
      runId: 'r-child',
      result: { output: 'done', usage: zeroUsage(), status: 'completed', state: multimodalState() },
    },
  },
  // The agent.end fixture MUST be multimodal - a state without binary
  // payloads would make this gate vacuous.
  'agent.end': {
    type: 'agent.end',
    runId: 'r',
    result: { output: 'done', usage: zeroUsage(), status: 'completed', state: multimodalState() },
  },
  'agent.error': { type: 'agent.error', error: { message: 'boom', code: 'x' } },
};

function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('WireAgentEvent - every variant survives JSON and round-trips (W-046)', () => {
  for (const [type, ev] of Object.entries(FIXTURES) as Array<[AgentEvent['type'], AgentEvent]>) {
    it(`'${type}' wire form is JSON-stable and decodes back`, () => {
      const wire = toWireAgentEvent(ev);
      // JSON survivability: the wire form must contain no Uint8Array or
      // URL instance anywhere (both would be mangled by stringify).
      expect(JSON.stringify(wire)).not.toMatch(/"0":\s*137/);
      const parsed = jsonRoundTrip(wire);
      const back = fromWireAgentEvent(parsed);
      if (type === 'file.generated') {
        const decoded = back as { data: Uint8Array };
        expect(decoded.data).toBeInstanceOf(Uint8Array);
        expect(decoded.data).toEqual(BYTES);
      } else if (type === 'tool.execute.partial') {
        const decoded = back as { chunk: { kind: string; data: Uint8Array } };
        expect(decoded.chunk.data).toBeInstanceOf(Uint8Array);
        expect(decoded.chunk.data).toEqual(BYTES);
      } else if (type === 'agent.end') {
        const decoded = back as unknown as { result: { state: RunState } };
        const message = decoded.result.state.messages[0] as {
          content: readonly unknown[];
        };
        const image = message.content[0] as { image: Uint8Array };
        const file = message.content[1] as unknown as { file: URL };
        expect(image.image).toBeInstanceOf(Uint8Array);
        expect(image.image).toEqual(BYTES);
        expect(file.file).toBeInstanceOf(URL);
        expect(file.file.href).toBe('https://example.com/a.pdf');
        const outcome = decoded.result.state.steps[0]?.toolCalls[0]?.outcome as {
          contentParts: readonly { image: Uint8Array }[];
        };
        expect(outcome.contentParts[0]?.image).toBeInstanceOf(Uint8Array);
        expect(outcome.contentParts[0]?.image).toEqual(BYTES);
      } else if (type === 'subagent.event') {
        // W-036: the wrapped child event decodes RECURSIVELY.
        const decoded = back as unknown as {
          event: { result: { state: RunState } };
        };
        const message = decoded.event.result.state.messages[0] as {
          content: readonly unknown[];
        };
        const image = message.content[0] as { image: Uint8Array };
        const file = message.content[1] as unknown as { file: URL };
        expect(image.image).toBeInstanceOf(Uint8Array);
        expect(image.image).toEqual(BYTES);
        expect(file.file).toBeInstanceOf(URL);
      } else {
        // Non-binary variants must be untouched by the projection.
        expect(toWireAgentEvent(ev)).toBe(ev);
        expect(back).toEqual(jsonRoundTrip(ev));
      }
    });
  }

  it('binary payloads never reach the wire form raw', () => {
    for (const ev of Object.values(FIXTURES)) {
      const serialized = JSON.stringify(toWireAgentEvent(ev));
      // The numeric-key corruption signature of a stringified Uint8Array.
      expect(serialized).not.toMatch(/"0":137,"1":80/);
    }
  });
});
