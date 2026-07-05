/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `Provider` for the multi-agent-crew example. The
 * same provider instance powers all three roles (supervisor / worker-a
 * researcher / worker-b writer); it dispatches on the system prompt's
 * role marker, fans the response out per role, and yields either a
 * `transfer_to_<worker>` tool-call sequence (supervisor) or a single
 * `text-delta` followed by a zero-usage `finish` (workers, supervisor's
 * final synthesis turn). No sockets, no child processes, no disk I/O.
 *
 * The supervisor stub is stateful per call: it counts the tool messages
 * already in `req.messages` to decide which transition to emit on the
 * current step. Step 1 (zero tool messages) → transfer to worker-a;
 * step 2 (one tool message) → transfer to worker-b; step 3 (two tool
 * messages) → final synthesized text joining both worker outputs.
 */

import type {
  Message,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
} from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';

const STUB_CAPABILITIES: ProviderCapabilities = Object.freeze({
  streaming: true,
  toolCalling: true,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 4_096,
  reasoningContract: 'optional',
});

/** Marker substrings the stub looks for inside system prompts. */
export const ROLE_MARKERS = Object.freeze({
  supervisor: '[role:supervisor]',
  researcher: '[role:researcher]',
  writer: '[role:writer]',
});

/** Canonical worker agent names. Must match the `createAgent({ name })` values. */
export const WORKER_NAMES = Object.freeze({
  researcher: 'worker-a',
  writer: 'worker-b',
});

/** Auto-generated transfer tool names produced by the agent runtime. */
export const TRANSFER_TOOLS = Object.freeze({
  researcher: `transfer_to_${WORKER_NAMES.researcher}`,
  writer: `transfer_to_${WORKER_NAMES.writer}`,
});

/** Crew-stub roles surfaced by {@link classifyRequest}. */
export type CrewRole = 'supervisor' | 'researcher' | 'writer';

/**
 * Inspect a provider request and return the matching role. Walks the
 * messages forward and returns the first system message that carries a
 * known marker; falls back to `'supervisor'` (most common) when no
 * marker is found.
 *
 * The agent runtime's handoff path injects the sub-agent's own
 * instructions FIRST (then appends the filtered parent history), which
 * means a worker's own marker always precedes the supervisor's marker
 * inside the worker's request — the linear walk picks the worker.
 */
export function classifyRequest(req: ProviderRequest): CrewRole {
  for (const m of req.messages) {
    if (m.role !== 'system') continue;
    const sys = typeof m.content === 'string' ? m.content : '';
    if (sys.includes(ROLE_MARKERS.researcher)) return 'researcher';
    if (sys.includes(ROLE_MARKERS.writer)) return 'writer';
    if (sys.includes(ROLE_MARKERS.supervisor)) return 'supervisor';
  }
  return 'supervisor';
}

/**
 * Extract the most recent user-message text. Used by both worker stubs
 * to derive the topic of the request and by the supervisor stub for
 * the final synthesis turn.
 */
export function readLastUserText(messages: ReadonlyArray<Message>): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m === undefined || m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const parts: string[] = [];
    for (const part of m.content) {
      if (part.type === 'text') parts.push(part.text);
    }
    if (parts.length > 0) return parts.join(' ');
  }
  return '';
}

function readToolMessageContents(messages: ReadonlyArray<Message>): ReadonlyArray<string> {
  const out: string[] = [];
  for (const m of messages) {
    if (m.role !== 'tool') continue;
    if (typeof m.content === 'string') {
      out.push(m.content);
    } else {
      const parts: string[] = [];
      for (const part of m.content) {
        if (part.type === 'text') parts.push(part.text);
      }
      out.push(parts.join(' '));
    }
  }
  return out;
}

/** Canonical researcher reply for a topic. */
export function researcherReply(topic: string): string {
  return (
    `[researched] Key findings about '${topic}': ` +
    `(1) prior art covers the basics; ` +
    `(2) two open questions remain; ` +
    `(3) recommended sources are reputable.`
  );
}

/** Canonical writer reply given the prior researcher output. */
export function writerReply(researcherOutput: string): string {
  return (
    `[written] Polished paragraph: ${researcherOutput.replace(/^\[researched\]\s*/, '').trim()} ` +
    `Stitched together for the operator.`
  );
}

/** Canonical supervisor synthesis joining both worker outputs. */
export function supervisorFinalReply(researcher: string, writer: string): string {
  return (
    `Crew synthesis — ` +
    `researcher said: "${researcher}"; ` +
    `writer said: "${writer}". ` +
    `Both contributions delivered.`
  );
}

interface ProviderStreamPlan {
  readonly events: ReadonlyArray<ProviderEvent>;
  readonly responseText: string;
}

function planSupervisorTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const tools = readToolMessageContents(req.messages);
  const startMeta: ProviderEvent = {
    type: 'stream-start',
    metadata: { providerName: 'crew-stub', modelId },
  };
  if (tools.length === 0) {
    const toolCallId = 'call_supervisor_to_worker_a';
    const args = { input: readLastUserText(req.messages) };
    return {
      responseText: '',
      events: [
        startMeta,
        { type: 'tool-call-start', toolCallId, toolName: TRANSFER_TOOLS.researcher },
        { type: 'tool-call-input-delta', toolCallId, argsDelta: JSON.stringify(args) },
        { type: 'tool-call-end', toolCallId, finalArgs: args },
        { type: 'finish', finishReason: 'tool-calls', usage: zeroUsage() },
      ],
    };
  }
  if (tools.length === 1) {
    const researcherOutput = tools[0] ?? '';
    const toolCallId = 'call_supervisor_to_worker_b';
    const args = { input: researcherOutput };
    return {
      responseText: '',
      events: [
        startMeta,
        { type: 'tool-call-start', toolCallId, toolName: TRANSFER_TOOLS.writer },
        { type: 'tool-call-input-delta', toolCallId, argsDelta: JSON.stringify(args) },
        { type: 'tool-call-end', toolCallId, finalArgs: args },
        { type: 'finish', finishReason: 'tool-calls', usage: zeroUsage() },
      ],
    };
  }
  const researcherOutput = tools[0] ?? '';
  const writerOutput = tools[1] ?? '';
  const finalText = supervisorFinalReply(researcherOutput, writerOutput);
  return {
    responseText: finalText,
    events: [
      startMeta,
      { type: 'text-delta', delta: finalText },
      { type: 'finish', finishReason: 'stop', usage: zeroUsage() },
    ],
  };
}

function planWorkerTurn(req: ProviderRequest, role: CrewRole, modelId: string): ProviderStreamPlan {
  const startMeta: ProviderEvent = {
    type: 'stream-start',
    metadata: { providerName: 'crew-stub', modelId },
  };
  let text: string;
  if (role === 'researcher') {
    const userText = readLastUserText(req.messages);
    text = researcherReply(userText);
  } else {
    // The writer agent runs after the researcher; the agent runtime
    // injects the researcher's output as the most recent `tool` message
    // inside the filtered handoff history. Fall back to the user task
    // if (for some reason) no prior tool result is present.
    const tools = readToolMessageContents(req.messages);
    const researcherOutput =
      tools.length > 0 ? (tools[tools.length - 1] ?? '') : readLastUserText(req.messages);
    text = writerReply(researcherOutput);
  }
  return {
    responseText: text,
    events: [
      startMeta,
      { type: 'text-delta', delta: text },
      { type: 'finish', finishReason: 'stop', usage: zeroUsage() },
    ],
  };
}

/** Build the deterministic stream plan for the supplied request. */
export function planTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const role = classifyRequest(req);
  if (role === 'supervisor') return planSupervisorTurn(req, modelId);
  return planWorkerTurn(req, role, modelId);
}

/**
 * Build a stub `Provider`. Every call to `stream(...)` and
 * `generate(...)` plans the next turn deterministically and yields the
 * scripted events.
 */
export function createCrewStubProvider(options: { readonly modelId?: string } = {}): Provider {
  const modelId = options.modelId ?? 'multi-agent-crew-stub';
  const provider: Provider = {
    name: 'crew-stub',
    modelId,
    capabilities: STUB_CAPABILITIES,
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const plan = planTurn(req, modelId);
      for (const ev of plan.events) yield ev;
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const plan = planTurn(req, modelId);
      return {
        text: plan.responseText,
        usage: zeroUsage(),
        finishReason: plan.responseText.length > 0 ? 'stop' : 'tool-calls',
      };
    },
  };
  return provider;
}
