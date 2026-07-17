/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `Provider` for the assistant-bot recipe. One
 * provider instance powers both agents; it dispatches on the role
 * marker embedded in each agent's `instructions` system prompt (the
 * same convention as `multi-agent-crew` / `three-agent-harness`) and
 * derives every turn from the request messages alone - no cursor, no
 * shared state - so suspend/resume replays stay correct. No sockets,
 * no child processes, no disk I/O.
 *
 * Turn plans:
 *
 * - **assistant, "daily summary" task** - counts the tool messages
 *   already in `req.messages`: 0 -> call `add_reminder` (ungated);
 *   1 -> call `send_daily_summary` (the `needsApproval: true` gate
 *   parks the run); 2+ -> final text quoting the summary receipt.
 * - **assistant, anything else** - if the assembled system prompt
 *   carries an `<auto_recalled_facts>` block (the memory context
 *   engine's Layer 6), answer from the first recalled fact;
 *   otherwise admit the gap. This is what proves recall end-to-end:
 *   the stub can only "know" what memory actually injected.
 * - **heartbeat** - a checklist mentioning `overdue` yields a real
 *   finding; anything else yields the `HEARTBEAT_OK` sentinel, which
 *   the heartbeat runner suppresses instead of delivering.
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
  contextWindow: 32_768,
  maxOutput: 4_096,
  reasoningContract: 'optional',
});

/** Marker substrings the stub looks for inside system prompts. */
export const ROLE_MARKERS = Object.freeze({
  assistant: '[role:assistant]',
  heartbeat: '[role:heartbeat]',
});

/** Tool names the stub emits calls for. Must match the registered tools. */
export const STUB_TOOL_NAMES = Object.freeze({
  addReminder: 'add_reminder',
  sendDailySummary: 'send_daily_summary',
});

/** Deterministic reminder payload the stub asks `add_reminder` to store. */
export const STUB_REMINDER_INPUT = Object.freeze({
  text: 'Water the plants',
  due: 'tomorrow',
});

/** The all-quiet sentinel the heartbeat run emits when nothing is due. */
export const HEARTBEAT_SENTINEL = 'HEARTBEAT_OK';

/** Substring that flips a user turn onto the daily-summary tool plan. */
export const DAILY_SUMMARY_TRIGGER = 'daily summary';

/** Roles surfaced by {@link classifyRequest}. */
export type BotRole = 'assistant' | 'heartbeat';

/**
 * Inspect a provider request and return the matching role. Walks the
 * system messages for a known marker; with `autoAssembleContext` the
 * agent's instructions become Layer 2 of the assembled prompt, so the
 * marker survives inside the (much larger) system message.
 */
export function classifyRequest(req: ProviderRequest): BotRole {
  for (const m of req.messages) {
    if (m.role !== 'system') continue;
    const sys = typeof m.content === 'string' ? m.content : '';
    if (sys.includes(ROLE_MARKERS.heartbeat)) return 'heartbeat';
    if (sys.includes(ROLE_MARKERS.assistant)) return 'assistant';
  }
  return 'assistant';
}

/** Most recent user-message text (the current task / checklist). */
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

/** Concatenated system-message text (the assembled prompt). */
export function readSystemText(messages: ReadonlyArray<Message>): string {
  const parts: string[] = [];
  for (const m of messages) {
    if (m.role !== 'system') continue;
    if (typeof m.content === 'string') parts.push(m.content);
  }
  return parts.join('\n');
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

/**
 * Extract the fact texts the context engine injected as Layer 6
 * (`<auto_recalled_facts><fact ...>TEXT</fact>...`). Returns `[]`
 * when memory injected nothing - the stub then has nothing to
 * answer from, which is exactly the point.
 */
export function extractRecalledFacts(systemText: string): ReadonlyArray<string> {
  const out: string[] = [];
  const re = /<fact\b[^>]*>([\s\S]*?)<\/fact>/g;
  let match = re.exec(systemText);
  while (match !== null) {
    const raw = match[1] ?? '';
    out.push(raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim());
    match = re.exec(systemText);
  }
  return out;
}

/** Canonical answer built from the first auto-recalled fact. */
export function recallReply(factText: string): string {
  return `From memory: ${factText}`;
}

/** Canonical answer when memory injected no fact for the question. */
export const NO_RECALL_REPLY = 'I do not have that in memory yet - tell me and I will remember it.';

/** Canonical final text once the gated summary tool has executed. */
export function summaryDoneReply(receipt: string): string {
  return `All set - reminder saved and ${receipt}`;
}

/** Canonical heartbeat finding for an overdue-flavoured checklist. */
export function heartbeatFindingReply(): string {
  return (
    `Heads-up: the reminder "${STUB_REMINDER_INPUT.text}" is still pending ` +
    `(due ${STUB_REMINDER_INPUT.due}) - consider dealing with it today.`
  );
}

interface ProviderStreamPlan {
  readonly events: ReadonlyArray<ProviderEvent>;
  readonly responseText: string;
}

function textPlan(startMeta: ProviderEvent, text: string): ProviderStreamPlan {
  return {
    responseText: text,
    events: [
      startMeta,
      { type: 'text-delta', delta: text },
      { type: 'finish', finishReason: 'stop', usage: zeroUsage() },
    ],
  };
}

function toolCallPlan(
  startMeta: ProviderEvent,
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>,
): ProviderStreamPlan {
  return {
    responseText: '',
    events: [
      startMeta,
      { type: 'tool-call-start', toolCallId, toolName },
      { type: 'tool-call-input-delta', toolCallId, argsDelta: JSON.stringify(args) },
      { type: 'tool-call-end', toolCallId, finalArgs: args },
      { type: 'finish', finishReason: 'tool-calls', usage: zeroUsage() },
    ],
  };
}

function planAssistantTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const startMeta: ProviderEvent = {
    type: 'stream-start',
    metadata: { providerName: 'assistant-bot-stub', modelId },
  };
  const lastUser = readLastUserText(req.messages);
  if (lastUser.toLowerCase().includes(DAILY_SUMMARY_TRIGGER)) {
    const tools = readToolMessageContents(req.messages);
    if (tools.length === 0) {
      return toolCallPlan(startMeta, 'call_add_reminder', STUB_TOOL_NAMES.addReminder, {
        ...STUB_REMINDER_INPUT,
      });
    }
    if (tools.length === 1) {
      // The `needsApproval: true` gate parks the run on this call.
      return toolCallPlan(
        startMeta,
        'call_send_daily_summary',
        STUB_TOOL_NAMES.sendDailySummary,
        {},
      );
    }
    const receipt = tools[tools.length - 1] ?? '';
    return textPlan(startMeta, summaryDoneReply(receipt));
  }
  const facts = extractRecalledFacts(readSystemText(req.messages));
  const firstFact = facts[0];
  if (firstFact !== undefined) return textPlan(startMeta, recallReply(firstFact));
  return textPlan(startMeta, NO_RECALL_REPLY);
}

function planHeartbeatTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const startMeta: ProviderEvent = {
    type: 'stream-start',
    metadata: { providerName: 'assistant-bot-stub', modelId },
  };
  const checklist = readLastUserText(req.messages);
  if (checklist.toLowerCase().includes('overdue')) {
    return textPlan(startMeta, heartbeatFindingReply());
  }
  return textPlan(startMeta, HEARTBEAT_SENTINEL);
}

/** Build the deterministic stream plan for the supplied request. */
export function planTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const role = classifyRequest(req);
  if (role === 'heartbeat') return planHeartbeatTurn(req, modelId);
  return planAssistantTurn(req, modelId);
}

/**
 * Build the stub `Provider`. Every call to `stream(...)` and
 * `generate(...)` plans the turn from the request messages alone and
 * yields the scripted events.
 */
export function createAssistantStubProvider(options: { readonly modelId?: string } = {}): Provider {
  const modelId = options.modelId ?? 'assistant-bot-stub';
  const provider: Provider = {
    name: 'assistant-bot-stub',
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
