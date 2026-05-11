/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `Provider` for the Slack-bot integration example.
 * The stub never opens a socket and never calls a real LLM. It looks at
 * the inbound `ProviderRequest` and decides one of three responses:
 *
 *   - When the most recent user message contains the case-insensitive
 *     marker `'submit expense'` (and no prior `submit_expense` tool
 *     result is present) the stub emits a single `submit_expense` tool
 *     call. The agent runtime invokes the tool's `needsApproval`
 *     predicate; high-amount submissions suspend the run with a
 *     `tool.approval.requested` event.
 *   - When a prior tool message carries the approval-confirmation
 *     payload (`approved: true`), the stub emits the canonical "approved"
 *     final assistant message that downstream code mirrors back to
 *     Slack.
 *   - Otherwise the stub emits a generic echo reply, which lets the
 *     `processSlackEvent({...})` happy-path test exercise the full
 *     bridge without involving the approval lifecycle.
 *
 * The stub is intentionally side-effect-free and entirely synchronous
 * over its event stream so the smoke test stays well under 30 s.
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

/** Marker the stub looks for inside the latest user message. */
export const SUBMIT_EXPENSE_MARKER = 'submit expense';

/** Tool name the stub asks the runtime to invoke. Matches `expense-tool.ts`. */
export const SUBMIT_EXPENSE_TOOL_NAME = 'submit_expense';

/** Prefix for the "happy path" stub echo reply. */
export const STUB_ECHO_PREFIX = 'slack-bot-stub: ';

/** Canonical final assistant message after a successful approval. */
export function approvalConfirmedReply(ref: string): string {
  return `Expense ${ref} approved and submitted to finance.`;
}

/** Canonical fallback reply when the user has not asked for an expense. */
export function genericEchoReply(req: ProviderRequest): string {
  return `${STUB_ECHO_PREFIX}${lastUserText(req.messages)}`;
}

/** Extract the textual content of the most recent user message. */
export function lastUserText(messages: ReadonlyArray<Message>): string {
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

/** Inspect tool-result messages. Returns the payload of the most recent one. */
export function lastToolPayload(
  messages: ReadonlyArray<Message>,
): { readonly approved: boolean; readonly ref?: string; readonly raw: string } | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m === undefined || m.role !== 'tool') continue;
    const raw = typeof m.content === 'string' ? m.content : extractText(m.content);
    if (raw.length === 0) continue;
    const parsed = tryParseToolPayload(raw);
    return { ...parsed, raw };
  }
  return undefined;
}

function extractText(parts: ReadonlyArray<unknown>): string {
  const out: string[] = [];
  for (const part of parts) {
    if (typeof part !== 'object' || part === null) continue;
    const candidate = part as { readonly type?: unknown; readonly text?: unknown };
    if (candidate.type === 'text' && typeof candidate.text === 'string') {
      out.push(candidate.text);
    }
  }
  return out.join(' ');
}

function tryParseToolPayload(raw: string): { readonly approved: boolean; readonly ref?: string } {
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value === 'object' && value !== null) {
      const v = value as { readonly approved?: unknown; readonly ref?: unknown };
      const approved = v.approved === true;
      const ref = typeof v.ref === 'string' ? v.ref : undefined;
      return ref === undefined ? { approved } : { approved, ref };
    }
  } catch {
    // Fall through to the heuristic.
  }
  return { approved: /\bapprov(?:al|ed)\b/i.test(raw) };
}

interface ProviderStreamPlan {
  readonly events: ReadonlyArray<ProviderEvent>;
  readonly finalText: string;
}

function planTurn(req: ProviderRequest, modelId: string): ProviderStreamPlan {
  const startMeta: ProviderEvent = {
    type: 'stream-start',
    metadata: { providerName: 'slack-bot-stub', modelId },
  };
  const toolPayload = lastToolPayload(req.messages);
  if (toolPayload?.approved === true) {
    const text = approvalConfirmedReply(toolPayload.ref ?? 'EXP-UNKNOWN');
    return {
      finalText: text,
      events: [
        startMeta,
        { type: 'text-delta', delta: text },
        { type: 'finish', finishReason: 'stop', usage: zeroUsage() },
      ],
    };
  }
  const userText = lastUserText(req.messages);
  if (userText.toLowerCase().includes(SUBMIT_EXPENSE_MARKER) && toolPayload === undefined) {
    const amount = parseAmount(userText);
    const justification = parseJustification(userText);
    const args = { amount, justification };
    const toolCallId = 'call_submit_expense';
    return {
      finalText: '',
      events: [
        startMeta,
        { type: 'tool-call-start', toolCallId, toolName: SUBMIT_EXPENSE_TOOL_NAME },
        { type: 'tool-call-input-delta', toolCallId, argsDelta: JSON.stringify(args) },
        { type: 'tool-call-end', toolCallId, finalArgs: args },
        { type: 'finish', finishReason: 'tool-calls', usage: zeroUsage() },
      ],
    };
  }
  const echo = genericEchoReply(req);
  return {
    finalText: echo,
    events: [
      startMeta,
      { type: 'text-delta', delta: echo },
      { type: 'finish', finishReason: 'stop', usage: zeroUsage() },
    ],
  };
}

function parseAmount(text: string): number {
  const match = /\$\s*([0-9][0-9,]*\.?[0-9]*)/.exec(text);
  if (match === null || match[1] === undefined) return 0;
  const cleaned = match[1].replace(/,/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function parseJustification(text: string): string {
  const idx = text.toLowerCase().indexOf('for ');
  if (idx === -1) return text.trim().slice(0, 280);
  return text
    .slice(idx + 4)
    .trim()
    .slice(0, 280);
}

/**
 * Build the stub `Provider`. Every call to `stream(...)` and
 * `generate(...)` plans the next turn deterministically with the rules
 * documented at the top of the module.
 */
export function createStubProvider(options: { readonly modelId?: string } = {}): Provider {
  const modelId = options.modelId ?? 'slack-bot-stub';
  const provider: Provider = {
    name: 'slack-bot-stub',
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
        text: plan.finalText,
        usage: zeroUsage(),
        finishReason: plan.finalText.length > 0 ? 'stop' : 'tool-calls',
      };
    },
  };
  return provider;
}
