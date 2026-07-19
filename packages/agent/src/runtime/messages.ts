/**
 * Message-buffer shaping and step-accounting helpers for the agent
 * runtime: reasoning-retention resolution, assistant-message assembly,
 * the compaction-stable system-prefix scan, per-step request assembly,
 * tool-error rendering for the model, and usage arithmetic. Extracted
 * verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  AssistantMessage,
  Message,
  MessageContent,
  Provider,
  ReasoningContent,
  ReasoningRetention,
  RunState,
  ToolCall,
  ToolError,
  Usage,
  UsageAccumulator,
} from '@graphorin/core';
import { COMPACTION_SUMMARY_MARKER } from '@graphorin/memory';
import { addModelUsage } from '../run-state/index.js';
import { renderPlanRecitation } from '../tooling/plan.js';

/** Most-recent user-role text in `messages` (for context-engine auto-recall). */
export function lastUserText(messages: ReadonlyArray<Message>): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const text = m.content
      .filter((p): p is { readonly type: 'text'; readonly text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ');
    return text.length > 0 ? text : undefined;
  }
  return undefined;
}

/**
 * Resolve the effective {@link ReasoningRetention} for a step. The
 * agent-level setting wins over the provider-level default; when
 * neither is supplied, the provider's `reasoningContract`
 * capability drives the default.
 *
 * The contract-driven defaults mirror `REASONING_RETENTION_DEFAULTS` in
 * `@graphorin/provider` (the documented, conservative defaults - see
 * providers.md). `optional` resolves to `'strip'`, not
 * `'pass-through-all'` - the conservative default keeps chain-of-thought
 * out of the persisted transcript and off the next provider call unless a
 * caller opts in via an agent- or provider-level override.
 */
export function effectiveReasoningRetention(
  agentOverride: ReasoningRetention | undefined,
  provider: Provider,
): ReasoningRetention {
  if (agentOverride !== undefined) return agentOverride;
  const contract = provider.capabilities.reasoningContract;
  switch (contract) {
    case 'round-trip-required':
      return 'pass-through-claude';
    case 'optional':
      return 'strip';
    case 'hidden':
      return 'strip';
    default:
      return 'strip';
  }
}

/**
 * Build the assistant message that the runtime appends to the
 * message buffer after a successful provider call. When the
 * effective {@link ReasoningRetention} is not `'strip'`, the
 * assembled `reasoning` content parts ride along on `content` so
 * the next provider call honours the wire-correct round-trip
 * contract.
 */
export function buildAssistantMessage(
  text: string,
  reasoningParts: ReadonlyArray<ReasoningContent>,
  toolCalls: ReadonlyArray<ToolCall>,
  agentId: string,
  retention: ReasoningRetention,
): AssistantMessage {
  const preserveReasoning = retention !== 'strip' && reasoningParts.length > 0;
  if (preserveReasoning) {
    const parts: MessageContent[] = [...reasoningParts];
    if (text.length > 0) parts.push({ type: 'text', text });
    return {
      role: 'assistant',
      content: parts,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
      agentId,
    };
  }
  return {
    role: 'assistant',
    content: text,
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
    agentId,
  };
}

/**
 * Strip every {@link ReasoningContent} part from each message in
 * the supplied list. Used at the swap point when `prepareStep`
 * downgrades the provider's `reasoningContract` mid-run.
 */
export function stripReasoningFromMessages(messages: Message[]): { stripped: number } {
  let stripped = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg === undefined) continue;
    if (msg.role === 'system' || msg.role === 'tool') continue;
    if (typeof msg.content === 'string') continue;
    const filtered = msg.content.filter((p) => p.type !== 'reasoning');
    if (filtered.length === msg.content.length) continue;
    stripped += msg.content.length - filtered.length;
    if (msg.role === 'assistant') {
      messages[i] = { ...msg, content: filtered };
    } else {
      messages[i] = { ...msg, content: filtered };
    }
  }
  return { stripped };
}

/**
 * Count the leading contiguous run of `system` messages in the initial
 * buffer - the trusted, KV-cache-stable instruction prefix. Captured
 * once at run start: auto-compaction summarises only the
 * messages after this prefix, so the prefix stays byte-identical across
 * every step (the provider's cache breakpoint is real) and a long run
 * never re-pays for the system prompt.
 *
 * The length is fixed for the run rather than re-derived per compaction
 * on purpose: each compaction inserts its summary as a `system` message
 * right after the prefix, so re-scanning the leading run would absorb
 * that summary into the prefix and shield it from the next compaction -
 * summaries would stack unbounded. Pinning the original length keeps
 * each prior summary inside the compactable body, where the next pass
 * folds it into a fresh summary-of-summary.
 */
/**
 * Marker prefix stamped on every compaction summary. The prefix scan
 * must stop at it - after a compact-then-suspend cycle
 * the summary is a SYSTEM message sitting right after the true prefix,
 * and counting it in would pin it (and every later summary) outside the
 * compactable window forever, growing the uncompactable prefix by one
 * summary per cycle. The constant is canonical in
 * `@graphorin/memory` (next to the summary template that stamps it);
 * re-exported here for the runtime's internal imports.
 */
export { COMPACTION_SUMMARY_MARKER };

export function countLeadingSystemMessages(messages: ReadonlyArray<Message>): number {
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (msg?.role !== 'system') break;
    if (typeof msg.content === 'string' && msg.content.startsWith(COMPACTION_SUMMARY_MARKER)) {
      break;
    }
    i += 1;
  }
  return i;
}

/**
 * Immutable usage sum. Optional token fields (reasoning + prompt-cache
 * legs) appear in the result only when at least one
 * side carries them, so pre-cache serialized shapes stay byte-identical.
 */
/**
 * Assemble the per-step request messages. Trailing, request-only
 * additions ride the LAST prompt-cache anchor and never touch the shared
 * `messages` buffer or the persisted RunState: the structured-output
 * instruction and the attention-recitation plan block are both
 * appended here, in that order, so the stable prompt prefix is unchanged
 * and only the small trailing tail is re-sent each step.
 */
export function buildStepMessages(
  messages: ReadonlyArray<Message>,
  structuredInstruction: string | undefined,
  todos: ReadonlyArray<import('@graphorin/core').TodoItem> | undefined,
): Message[] {
  const out: Message[] = [...messages];
  if (structuredInstruction !== undefined) {
    out.push({ role: 'system', content: structuredInstruction });
  }
  const recitation = renderPlanRecitation(todos);
  if (recitation !== null) {
    out.push({ role: 'system', content: recitation });
  }
  return out;
}

export function addUsage(a: Usage, b: Usage): Usage {
  const optional = (x: number | undefined, y: number | undefined): number | undefined =>
    x === undefined && y === undefined ? undefined : (x ?? 0) + (y ?? 0);
  const reasoningTokens = optional(a.reasoningTokens, b.reasoningTokens);
  const cachedReadTokens = optional(a.cachedReadTokens, b.cachedReadTokens);
  const cacheWriteTokens = optional(a.cacheWriteTokens, b.cacheWriteTokens);
  // C5: preserve reported cost (same-currency amounts add; a
  // cross-currency pair keeps the first-seen currency - conversion is
  // not this function's business).
  const cost =
    a.cost === undefined
      ? b.cost !== undefined
        ? { ...b.cost }
        : undefined
      : b.cost !== undefined && b.cost.currency === a.cost.currency
        ? { amount: a.cost.amount + b.cost.amount, currency: a.cost.currency }
        : { ...a.cost };
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
    ...(cachedReadTokens !== undefined ? { cachedReadTokens } : {}),
    ...(cacheWriteTokens !== undefined ? { cacheWriteTokens } : {}),
    ...(cost !== undefined ? { cost } : {}),
  };
}

/**
 * Render a ToolError for the model. The first line keeps the
 * long-standing `Error: <message>` shape; a bracketed second line carries
 * the typed kind + the recovery envelope, which is what actually changes
 * model behaviour after a failure (retry vs. fix args vs. give up).
 */
export function renderToolErrorMessage(error: ToolError): string {
  const parts: string[] = [`kind: ${error.kind}`];
  if (error.recoverable !== undefined) {
    parts.push(error.recoverable ? 'recoverable: yes' : 'recoverable: no');
  }
  if (error.recoveryHint !== undefined) parts.push(`suggested action: ${error.recoveryHint}`);
  if (error.hint !== undefined) parts.push(error.hint);
  return `Error: ${error.message}\n[${parts.join('; ')}]`;
}

/** In-place variant of {@link addUsage} for mutable accumulators. */
export function accumulateUsage(target: Usage, delta: Usage): void {
  target.promptTokens += delta.promptTokens;
  target.completionTokens += delta.completionTokens;
  target.totalTokens += delta.totalTokens;
  if (delta.reasoningTokens !== undefined) {
    target.reasoningTokens = (target.reasoningTokens ?? 0) + delta.reasoningTokens;
  }
  if (delta.cachedReadTokens !== undefined) {
    target.cachedReadTokens = (target.cachedReadTokens ?? 0) + delta.cachedReadTokens;
  }
  if (delta.cacheWriteTokens !== undefined) {
    target.cacheWriteTokens = (target.cacheWriteTokens ?? 0) + delta.cacheWriteTokens;
  }
  // C5: fold reported cost so `state.usage.cost` reflects the whole run
  // (pricing middleware fills per-call cost; before this the run-level
  // aggregate silently dropped it). Same-currency amounts add; a
  // cross-currency delta keeps the first-seen currency untouched -
  // currency conversion is not this function's business. The run-level
  // budget reads the USD aggregate (see runtime/run-budget.ts).
  if (delta.cost !== undefined) {
    if (target.cost === undefined) {
      target.cost = { ...delta.cost };
    } else if (target.cost.currency === delta.cost.currency) {
      target.cost = { ...target.cost, amount: target.cost.amount + delta.cost.amount };
    }
  }
}

/**
 * Fold a completed (or failed - tokens were spent either way) child
 * run's usage into the parent run's accounting: `state.usage`,
 * `state.usageByModel` and the run's {@link UsageAccumulator}.
 * Children carrying a per-model breakdown fold model-by-model (each
 * child model entry counts as one attempt on the parent); a child
 * without `usageByModel` folds its aggregate under the synthetic id
 * `sub-agent:<name>`, skipped entirely when all-zero so phantom
 * entries never appear.
 *
 * Must be called exactly once per child run at exactly one seam -
 * a second call double-counts (pinned by test).
 */
export function foldChildRunUsage(
  state: RunState,
  usageAcc: UsageAccumulator | undefined,
  childState: RunState,
  childName: string,
): void {
  const byModel = childState.usageByModel;
  if (byModel !== undefined && Object.keys(byModel).length > 0) {
    for (const [modelId, usage] of Object.entries(byModel)) {
      addModelUsage(state, modelId, usage);
      accumulateUsage(state.usage, usage);
      usageAcc?.add(modelId, usage);
    }
    return;
  }
  const aggregate = childState.usage;
  if (
    aggregate.promptTokens === 0 &&
    aggregate.completionTokens === 0 &&
    aggregate.totalTokens === 0
  ) {
    return;
  }
  const syntheticId = `sub-agent:${childName}`;
  addModelUsage(state, syntheticId, aggregate);
  accumulateUsage(state.usage, aggregate);
  usageAcc?.add(syntheticId, aggregate);
}

/**
 * Resolve the effective reasoning-retention policy for
 * this step. Drop any buffered reasoning when the
 * contract downgrades to `'strip'`.
 */
export function applyReasoningRetention(
  agentOverride: ReasoningRetention | undefined,
  provider: Provider,
  messages: Message[],
  stateMessages: Message[],
): ReasoningRetention {
  const reasoningPolicy = effectiveReasoningRetention(agentOverride, provider);
  if (reasoningPolicy === 'strip') {
    const { stripped } = stripReasoningFromMessages(messages);
    // Mirror the strip into RunState so the persisted state
    // matches the in-flight buffer.
    if (stripped > 0) {
      // The structural drop is bytes-equal across `messages`
      // and `state.messages` (both arrays carry the same
      // references); re-strip RunState explicitly to be safe.
      stripReasoningFromMessages(stateMessages);
    }
  }
  return reasoningPolicy;
}
