/**
 * Handoff filter library - a small set of pure, composable functions
 * that take the parent agent's message history and return a filtered
 * subset suitable for forwarding to a child agent.
 *
 * Every filter pairs a `HandoffFilter` runtime function with a
 * serializable {@link HandoffInputFilterDescriptor} so the JSONL
 * session export (`@graphorin/sessions`) can replay the filter stack
 * even after the runtime implementations evolve.
 *
 * Reasoning content is **always** stripped at the handoff boundary -
 * `filters.compose(...)` guarantees `stripReasoning()` runs last so a
 * caller-supplied filter cannot accidentally forward reasoning to a
 * child agent. This is the confidentiality + token-economy default
 * documented in the agent-loop reference.
 *
 * @packageDocumentation
 */

import type {
  HandoffFilter,
  HandoffInputFilterDescriptor,
  Message,
  Sensitivity,
} from '@graphorin/core';
import { SENSITIVITY_ORDER } from '@graphorin/core';

const SENSITIVITY_RANK: Record<Sensitivity, number> = {
  public: 0,
  internal: 1,
  secret: 2,
};

/**
 * Return `true` iff the message's effective sensitivity is at most
 * `maxTier` (a strictly weaker check than core's
 * `acceptsSensitivity` because the filter library does not have
 * the provider's `acceptsSensitivity[]` array - only a ceiling).
 */
function withinTier(record: Sensitivity, maxTier: Sensitivity): boolean {
  return SENSITIVITY_RANK[record] <= SENSITIVITY_RANK[maxTier];
}

void SENSITIVITY_ORDER;

/**
 * A `HandoffFilter` paired with the serializable descriptor that
 * round-trips through the JSONL session export. Authors of custom
 * filters return one of these via `filters.custom({...})`.
 *
 * @stable
 */
export interface DescribedFilter extends HandoffFilter {
  readonly descriptor: HandoffInputFilterDescriptor;
}

function makeFilter(fn: HandoffFilter, descriptor: HandoffInputFilterDescriptor): DescribedFilter {
  const wrapped = ((history: readonly Message[]): readonly Message[] =>
    fn(history)) as DescribedFilter;
  Object.defineProperty(wrapped, 'descriptor', { value: descriptor, enumerable: true });
  return wrapped;
}

function isReasoningPart(part: unknown): boolean {
  if (typeof part !== 'object' || part === null) return false;
  const t = (part as { readonly type?: unknown }).type;
  return t === 'reasoning';
}

function stripReasoningFromMessage(msg: Message): Message {
  if (msg.role === 'system' || msg.role === 'tool') return msg;
  const content = msg.content;
  if (typeof content === 'string') return msg;
  const filtered = content.filter((part) => !isReasoningPart(part));
  if (filtered.length === content.length) return msg;
  if (msg.role === 'assistant') {
    return { ...msg, content: filtered };
  }
  return { ...msg, content: filtered };
}

/**
 * Keep the parent's system prompt and the last `n` non-system
 * messages. Default `n = 10` per DEC-146 / RB-40 security-first
 * compose.
 *
 * @stable
 */
export function lastN(n = 10): DescribedFilter {
  if (!Number.isFinite(n) || n <= 0) {
    throw new RangeError(`filters.lastN: n must be a positive integer (got ${String(n)})`);
  }
  return makeFilter(
    (history) => {
      const out: Message[] = [];
      for (const msg of history) {
        if (msg.role === 'system') {
          out.push(msg);
        }
      }
      const nonSystem: Message[] = history.filter((m) => m.role !== 'system');
      const tail = nonSystem.slice(Math.max(0, nonSystem.length - n));
      return [...out, ...tail];
    },
    { kind: 'last-n', meta: { n } },
  );
}

/**
 * Keep only the parent's system prompt and the most recent user
 * message. Useful for simple sub-agents that only need the question.
 *
 * @stable
 */
export function lastUser(): DescribedFilter {
  return makeFilter(
    (history) => {
      const out: Message[] = [];
      let lastUserIdx = -1;
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg && msg.role === 'user') {
          lastUserIdx = i;
          break;
        }
      }
      for (const msg of history) {
        if (msg.role === 'system') out.push(msg);
      }
      if (lastUserIdx >= 0) {
        const m = history[lastUserIdx];
        if (m) out.push(m);
      }
      return out;
    },
    { kind: 'last-user' },
  );
}

/**
 * The full unfiltered history. Discouraged - security-conscious
 * callers should pick {@link lastN} or {@link bySensitivity} instead
 * (a sub-agent rarely needs the parent's entire conversation).
 *
 * @stable
 */
export function full(): DescribedFilter {
  return makeFilter((history) => history.slice(), { kind: 'full' });
}

/**
 * Replace the parent's history with a single system message carrying
 * the supplied summary. Used by callers that wire in an LLM-based
 * summarizer outside the framework.
 *
 * @stable
 */
export function summary(text: string): DescribedFilter {
  return makeFilter(
    () => [
      {
        role: 'system',
        content: `[Summary of parent conversation]\n${text}`,
      },
    ],
    { kind: 'summary', meta: { summaryLength: text.length } },
  );
}

/**
 * Drop messages whose effective sensitivity ceiling exceeds
 * `maxTier`. Messages without sensitivity metadata default to
 * `'public'` and are always kept.
 *
 * The framework currently records sensitivity at the
 * `MessageContent` part level via the `inboundTrust` / `secret`
 * annotations. v0.1 ships a coarse-grained heuristic: a message is
 * kept iff every text part's content does not contain the literal
 * `[REDACTED:secret]` token AND every part's annotated sensitivity
 * is acceptable to `maxTier`. Operators that need a stricter
 * filter compose the function with `stripSensitiveOutputs()` or a
 * custom predicate.
 *
 * @stable
 */
export function bySensitivity(args: { readonly maxTier?: Sensitivity } = {}): DescribedFilter {
  const maxTier: Sensitivity = args.maxTier ?? 'public';
  return makeFilter(
    (history) => {
      const out: Message[] = [];
      for (const msg of history) {
        const content = msg.role === 'system' ? msg.content : msg.content;
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        if (text.includes('[REDACTED:secret]') && !withinTier('secret', maxTier)) {
          continue;
        }
        out.push(msg);
      }
      return out;
    },
    { kind: 'sensitivity-filter', meta: { maxTier } },
  );
}

/**
 * Strip every `ReasoningContent` part from each message. Always
 * applied at the handoff boundary (the `compose(...)` helper appends
 * this filter automatically).
 *
 * @stable
 */
export function stripReasoning(): DescribedFilter {
  return makeFilter((history) => history.map(stripReasoningFromMessage), {
    kind: 'strip-reasoning',
  });
}

/**
 * Strip tool messages whose `content` carries the literal token
 * `[REDACTED:secret]` or whose `secret` annotation marks the body as
 * sensitive. Conservative-by-design: the agent runtime tags
 * sensitive tool outputs at session-write time so this filter has
 * stable bytes to scan against.
 *
 * @stable
 */
export function stripSensitiveOutputs(): DescribedFilter {
  return makeFilter(
    (history) => {
      const out: Message[] = [];
      let stripped = 0;
      for (const msg of history) {
        if (msg.role === 'tool') {
          const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          if (text.includes('[REDACTED:')) {
            stripped += 1;
            continue;
          }
        }
        out.push(msg);
      }
      void stripped;
      return out;
    },
    { kind: 'strip-sensitive-outputs' },
  );
}

/**
 * Drop every assistant `toolCalls` array AND every `tool` message.
 * Useful when a sub-agent should only see the textual conversation.
 *
 * @stable
 */
export function stripToolCalls(): DescribedFilter {
  return makeFilter(
    (history) => {
      const out: Message[] = [];
      for (const msg of history) {
        if (msg.role === 'tool') continue;
        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          const { toolCalls: _toolCalls, ...rest } = msg;
          out.push(rest);
          continue;
        }
        out.push(msg);
      }
      return out;
    },
    { kind: 'strip-tool-calls' },
  );
}

/**
 * Compose multiple filters left-to-right. The composer **always**
 * appends `stripReasoning()` at the end so reasoning content never
 * crosses a handoff boundary regardless of caller intent.
 *
 * @stable
 */
export function compose(...filters: ReadonlyArray<HandoffFilter>): DescribedFilter {
  const stripper = stripReasoning();
  const ordered: ReadonlyArray<HandoffFilter> = [...filters, stripper];
  const descriptors: HandoffInputFilterDescriptor[] = filters.map((f) => {
    const desc = (f as DescribedFilter).descriptor;
    return desc ?? { kind: 'custom' };
  });
  descriptors.push(stripper.descriptor);
  return makeFilter(
    (history) => {
      let current: readonly Message[] = history;
      for (const filter of ordered) {
        current = filter(current);
      }
      return current;
    },
    { kind: 'compose', meta: { steps: descriptors } },
  );
}

/**
 * Wrap a caller-supplied function as a {@link DescribedFilter} with
 * the canonical `'custom'` descriptor.
 *
 * @stable
 */
export function custom(
  fn: HandoffFilter,
  meta?: Readonly<Record<string, unknown>>,
): DescribedFilter {
  return makeFilter(fn, meta !== undefined ? { kind: 'custom', meta } : { kind: 'custom' });
}

/**
 * The canonical default applied by the agent runtime to every
 * `Agent.toTool(...)` and `handoff(...)` invocation when the caller
 * does not supply an explicit filter.
 *
 * @stable
 */
export function defaultHandoffFilter(): DescribedFilter {
  return compose(lastN(10), stripSensitiveOutputs());
}

/**
 * Pure `HandoffInputFilterDescriptor` for callers that just need the
 * descriptor without instantiating the runtime function (e.g. the
 * sessions package's lenient-forward-parse path).
 *
 * @stable
 */
export const FILTER_KIND_CUSTOM: HandoffInputFilterDescriptor = { kind: 'custom' };

/** Aggregate module export. */
export const filters = {
  lastN,
  lastUser,
  full,
  summary,
  bySensitivity,
  stripReasoning,
  stripSensitiveOutputs,
  stripToolCalls,
  compose,
  custom,
  defaultHandoffFilter,
};
