/**
 * Profile-projection pass (wave-D D2, plan item 6) - materialises a
 * structured user-profile block from ACTIVE semantic facts. Where the
 * learned-context pass keeps a free-prose digest, this pass projects
 * facts into topic / sub-topic / content SLOTS with provenance
 * references back to the source facts, so the assembled system prompt
 * carries a compact, auditable "who is this user" card.
 *
 * Sourcing is deliberately conservative: only recall-eligible facts
 * (`status = 'active'`, live validity interval) whose W-019 supersede
 * is NOT pending feed the projection - a value that is already known
 * to be contested must not be presented as profile truth. Quarantined
 * facts never appear.
 *
 * The block (`profile`) is registered `readOnly: true`: the agent's
 * `block_*` tools refuse to mutate it (the projection is
 * consolidator-owned), and the pass itself writes through the storage
 * adapter's `working.upsert` - the one writer by construction.
 *
 * Scope: the block is written USER-scoped by default (`sessionId` /
 * `agentId` dropped), so one profile serves every session - and the
 * session-delete cascade deliberately does NOT erase it. The erasure
 * path for the user-scoped block is `memory.working.purge(userScope,
 * 'profile')` (hard delete); `profile.scope: 'session'` keeps the full
 * scope for per-peer profiles, whose purge rides the session cascade.
 *
 * Runs after the learned-context pass in the deep phase, same budget /
 * resilience envelope. Off by default (`profile` config absent).
 *
 * @packageDocumentation
 */

import type { Block, Fact, Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type { MemoryStoreAdapter } from '../../internal/storage-adapter.js';
import { defineBlock, type WorkingMemory } from '../../tiers/working-memory.js';
import type { BudgetTracker } from '../budget.js';

/** Reserved working-block label maintained by the pass. */
export const PROFILE_BLOCK_LABEL = 'profile';

/** Default character bound for the profile block. */
export const DEFAULT_PROFILE_MAX_CHARS = 1600;

/** Default slot cap. */
export const DEFAULT_PROFILE_MAX_SLOTS = 24;

/** How many active facts feed one projection call. */
const FACT_CONTEXT_LIMIT = 200;

/**
 * `createMemory({ profile })` configuration (public shape).
 *
 * @stable
 */
export interface ProfileProjectionConfig {
  /**
   * Topic taxonomy the projection is restricted to (supplied by the
   * operator - e.g. `['identity', 'preferences', 'health', 'work']`).
   * When given, slots whose topic is not in the list are dropped
   * deterministically; when omitted the model chooses topics freely.
   */
  readonly topics?: ReadonlyArray<string>;
  /** Maximum number of slots kept. Default `24`. */
  readonly maxSlots?: number;
  /** Character bound enforced on the stored block. Default `1600`. */
  readonly maxChars?: number;
  /**
   * Block scope: `'user'` (default) writes one user-scoped block
   * (survives session deletion; erased via `working.purge`);
   * `'session'` keeps the firing scope for per-peer profiles.
   */
  readonly scope?: 'user' | 'session';
}

/** Resolved (defaulted) form threaded through the consolidator config. */
export interface ResolvedProfileProjectionConfig {
  readonly topics: ReadonlyArray<string>;
  readonly maxSlots: number;
  readonly maxChars: number;
  readonly scope: 'user' | 'session';
}

/** Apply defaults to the public config. */
export function resolveProfileProjectionConfig(
  config: ProfileProjectionConfig,
): ResolvedProfileProjectionConfig {
  return Object.freeze({
    topics: Object.freeze([...(config.topics ?? [])]),
    maxSlots: config.maxSlots ?? DEFAULT_PROFILE_MAX_SLOTS,
    maxChars: config.maxChars ?? DEFAULT_PROFILE_MAX_CHARS,
    scope: config.scope ?? 'user',
  });
}

/** One projected profile slot. */
export interface ProfileSlot {
  readonly topic: string;
  readonly subTopic?: string;
  readonly content: string;
  /** Ids of the source facts backing this slot (provenance). */
  readonly sources: ReadonlyArray<string>;
}

const PROFILE_PROJECTION_SYSTEM_PROMPT = [
  'You maintain the structured profile block of a long-running personal-assistant memory.',
  'Project the supplied ACTIVE facts into profile slots. Each slot has a topic, an optional',
  'sub_topic, a concise content line, and the ids of the facts it is derived from.',
  'Only state what the facts support - never invent, never carry over anything from the',
  'previous profile that no fact still supports. Merge duplicates into one slot.',
  'Return a single JSON object: { "slots": [{ "topic": string, "sub_topic"?: string,',
  '"content": string, "sources": string[] }] }. No prose, no code fences.',
].join(' ');

/** Build the single projection request (pure - testable offline). */
export function buildProfileProjectionRequest(args: {
  readonly previous: string;
  readonly facts: ReadonlyArray<{ readonly id: string; readonly text: string }>;
  readonly config: ResolvedProfileProjectionConfig;
}): ProviderRequest {
  const sections: string[] = [
    `At most ${args.config.maxSlots} slots; the rendered block must stay under ${args.config.maxChars} characters.`,
  ];
  if (args.config.topics.length > 0) {
    sections.push(`Allowed topics (use ONLY these): ${args.config.topics.join(', ')}`);
  }
  sections.push(
    args.previous.length > 0
      ? `Previous profile block:\n${args.previous}`
      : 'Previous profile block: (none yet)',
    `Active facts:\n${args.facts.map((fact) => `- [${fact.id}] ${fact.text}`).join('\n')}`,
    'Return ONLY the JSON object.',
  );
  return {
    messages: [{ role: 'user', content: sections.join('\n\n') }],
    systemMessage: PROFILE_PROJECTION_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: Math.max(384, Math.ceil(args.config.maxChars / 2)),
  };
}

/**
 * Parse the model's `{ "slots": [...] }` reply. Returns `null` when
 * the reply is not parseable at all; otherwise a validated, capped
 * slot list: slots must carry a non-empty topic + content, `sources`
 * are filtered to ids that exist in `knownFactIds` (a hallucinated
 * provenance reference is dropped, and a slot with NO surviving source
 * is dropped entirely), and - when a taxonomy is configured - slots
 * with foreign topics are dropped.
 */
export function parseProfileSlots(
  raw: string,
  args: {
    readonly knownFactIds: ReadonlySet<string>;
    readonly config: ResolvedProfileProjectionConfig;
  },
): ReadonlyArray<ProfileSlot> | null {
  let text = raw.trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n?```\s*$/.exec(text);
  if (fence?.[1] !== undefined) text = fence[1].trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { slots?: unknown }).slots)
  ) {
    return null;
  }
  const out: ProfileSlot[] = [];
  for (const rawSlot of (parsed as { slots: ReadonlyArray<unknown> }).slots) {
    if (rawSlot === null || typeof rawSlot !== 'object') continue;
    const record = rawSlot as Record<string, unknown>;
    const topic = typeof record.topic === 'string' ? record.topic.trim() : '';
    const content = typeof record.content === 'string' ? record.content.trim() : '';
    if (topic.length === 0 || content.length === 0) continue;
    if (args.config.topics.length > 0 && !args.config.topics.includes(topic)) continue;
    const subTopic =
      typeof record.sub_topic === 'string' && record.sub_topic.trim().length > 0
        ? record.sub_topic.trim()
        : undefined;
    const sources = (Array.isArray(record.sources) ? record.sources : [])
      .filter((s): s is string => typeof s === 'string')
      .filter((s) => args.knownFactIds.has(s));
    if (sources.length === 0) continue;
    out.push({ topic, ...(subTopic !== undefined ? { subTopic } : {}), content, sources });
    if (out.length >= args.config.maxSlots) break;
  }
  return out;
}

/**
 * Deterministic renderer: slots grouped by topic (taxonomy order when
 * configured, else first-appearance order), sub-topics sorted
 * alphabetically inside a topic, provenance ids appended.
 */
export function renderProfileBlock(
  slots: ReadonlyArray<ProfileSlot>,
  config: ResolvedProfileProjectionConfig,
): string {
  if (slots.length === 0) return '';
  const topicOrder: string[] = [];
  if (config.topics.length > 0) {
    for (const topic of config.topics) {
      if (slots.some((slot) => slot.topic === topic)) topicOrder.push(topic);
    }
  } else {
    for (const slot of slots) {
      if (!topicOrder.includes(slot.topic)) topicOrder.push(slot.topic);
    }
  }
  const lines: string[] = [];
  for (const topic of topicOrder) {
    lines.push(`${topic}:`);
    const inTopic = slots
      .filter((slot) => slot.topic === topic)
      .sort((a, b) => (a.subTopic ?? '').localeCompare(b.subTopic ?? ''));
    for (const slot of inTopic) {
      const head = slot.subTopic !== undefined ? `${slot.subTopic}: ` : '';
      lines.push(`- ${head}${slot.content} [${slot.sources.join(', ')}]`);
    }
  }
  const rendered = lines.join('\n');
  return rendered.length > config.maxChars
    ? rendered.slice(0, config.maxChars).trimEnd()
    : rendered;
}

/** Inputs accepted by {@link runProfileProjectionPass}. */
export interface ProfileProjectionDeps {
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  /** Working tier - used to register the reserved (read-only) definition. */
  readonly working: WorkingMemory;
  /** Storage adapter - fact source (`semantic.listActive`) + block writer. */
  readonly store: MemoryStoreAdapter;
  readonly budget: BudgetTracker;
  readonly config: ResolvedProfileProjectionConfig;
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
}

/** Summary returned by {@link runProfileProjectionPass}. */
export interface ProfileProjectionOutcome {
  /** True when the block content changed this pass. */
  readonly updated: boolean;
  /** Slots kept after validation (0 when skipped). */
  readonly slots: number;
  readonly chars: number;
  readonly tokens: number;
  readonly costUsd: number;
  /** Why the pass made no write, when it did not. */
  readonly skippedReason?:
    | 'budget'
    | 'no-list-surface'
    | 'no-facts'
    | 'unparseable'
    | 'no-slots'
    | 'unchanged'
    | 'provider-error';
}

/**
 * Run the profile projection. Resilient by construction: a provider
 * failure or unparseable reply leaves the existing block untouched and
 * never throws; only storage errors propagate.
 */
export async function runProfileProjectionPass(
  deps: ProfileProjectionDeps,
): Promise<ProfileProjectionOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.profile-projection',
    deps.scope,
    { 'consolidator.phase': 'profile-projection' },
    async (span) => {
      const skip = (
        reason: NonNullable<ProfileProjectionOutcome['skippedReason']>,
        extra: { chars?: number; tokens?: number; costUsd?: number } = {},
      ): ProfileProjectionOutcome => {
        span.setAttributes({ 'consolidator.profile.skipped': reason });
        return {
          updated: false,
          slots: 0,
          chars: extra.chars ?? 0,
          tokens: extra.tokens ?? 0,
          costUsd: extra.costUsd ?? 0,
          skippedReason: reason,
        };
      };
      if (deps.budget.snapshot().paused) return skip('budget');
      const listActive = deps.store.semantic.listActive;
      if (typeof listActive !== 'function') return skip('no-list-surface');

      // D2 sourcing rule: recall-eligible AND not pending-supersede -
      // a contested value must not be presented as profile truth.
      const facts: ReadonlyArray<Fact> = await listActive.call(deps.store.semantic, deps.scope, {
        limit: FACT_CONTEXT_LIMIT,
        excludePendingSupersede: true,
      });
      span.setAttributes({ 'consolidator.profile.facts': facts.length });
      if (facts.length === 0) return skip('no-facts');

      // The block is registered READ-ONLY: agent block_* tools must not
      // mutate a consolidator-owned projection.
      if (deps.working.definitionFor(PROFILE_BLOCK_LABEL) === undefined) {
        deps.working.define(
          defineBlock({
            label: PROFILE_BLOCK_LABEL,
            description:
              'Structured user profile projected from active facts by the deep-phase ' +
              'profile-projection pass (consolidator-owned, read-only for agents).',
            charLimit: deps.config.maxChars,
            readOnly: true,
          }),
        );
      }
      const targetScope: SessionScope =
        deps.config.scope === 'user' ? { userId: deps.scope.userId } : deps.scope;
      const existing = await deps.store.working.get(targetScope, PROFILE_BLOCK_LABEL);
      const previous = existing?.value ?? '';

      let tokens = 0;
      let costUsd = 0;
      try {
        const res = await deps.provider.generate(
          buildProfileProjectionRequest({
            previous,
            facts: facts.map((fact) => ({ id: fact.id, text: fact.text })),
            config: deps.config,
          }),
        );
        tokens =
          (res.usage.promptTokens ?? 0) +
          (res.usage.completionTokens ?? 0) +
          (res.usage.reasoningTokens ?? 0);
        costUsd =
          deps.priceUsage?.({
            promptTokens: res.usage.promptTokens ?? 0,
            completionTokens: res.usage.completionTokens ?? 0,
          }) ?? 0;
        deps.budget.record({ phase: 'deep', tokens, costUsd });
        const slots = parseProfileSlots(res.text ?? '', {
          knownFactIds: new Set(facts.map((fact) => fact.id)),
          config: deps.config,
        });
        if (slots === null) {
          return skip('unparseable', { chars: previous.length, tokens, costUsd });
        }
        if (slots.length === 0) {
          return skip('no-slots', { chars: previous.length, tokens, costUsd });
        }
        const rendered = renderProfileBlock(slots, deps.config);
        if (rendered === previous) {
          return skip('unchanged', { chars: previous.length, tokens, costUsd });
        }
        // Direct adapter write: the tier's mutate path (correctly)
        // refuses read-only blocks - the pass is the single writer.
        const nowIso = new Date(
          (typeof deps.now === 'function' ? deps.now : Date.now)(),
        ).toISOString();
        const block: Block = {
          id: existing?.id ?? `block_profile_${targetScope.userId}`,
          kind: 'working',
          userId: targetScope.userId,
          ...(targetScope.sessionId !== undefined ? { sessionId: targetScope.sessionId } : {}),
          ...(targetScope.agentId !== undefined ? { agentId: targetScope.agentId } : {}),
          sensitivity: 'internal',
          label: PROFILE_BLOCK_LABEL,
          description:
            'Structured user profile projected from active facts by the deep-phase ' +
            'profile-projection pass (consolidator-owned, read-only for agents).',
          value: rendered,
          charLimit: deps.config.maxChars,
          readOnly: true,
          createdAt: existing?.createdAt ?? nowIso,
          updatedAt: nowIso,
        };
        await deps.store.working.upsert(targetScope, block);
        span.setAttributes({
          'consolidator.profile.updated': true,
          'consolidator.profile.slots': slots.length,
          'consolidator.profile.chars': rendered.length,
        });
        return { updated: true, slots: slots.length, chars: rendered.length, tokens, costUsd };
      } catch {
        // Resilient: a provider failure must never fail the deep phase.
        return skip('provider-error', { chars: previous.length, tokens, costUsd });
      }
    },
  );
}
