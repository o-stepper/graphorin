/**
 * Priority-ordered token-budget allocator. The allocator runs over the six
 * layers of the {@link ContextEngine}'s system prompt and trims the
 * lowest-priority layers first when the combined cost exceeds the configured
 * budget.
 *
 * This **truncation priority** is deliberately separate from the **emission
 * order**: the engine emits the surviving layers in a stable order
 * (identity → rules → blocks → skills → [KV-cache breakpoint] → metadata →
 * auto-recall) regardless of which were trimmed, so the cacheable prefix stays
 * byte-stable across turns. This ladder governs only *what gets dropped first*.
 *
 * Priority (configurable), highest preserved → first truncated:
 *
 * 1. **identity** - Layer 1 (`graphorin_memory_base` + agent
 *    instructions). Always preserved; truncated last.
 * 2. **memoryMetadata** - Layer 5. Small (~100-300 tokens).
 * 3. **activeRules** - Layer 4 procedural rules.
 * 4. **workingBlocks** - Layer 3.
 * 5. **activeSkills** - Layer 4 skills metadata cards.
 * 6. **autoRecall** - Layer 6. Lowest priority; truncated first.
 *
 * @packageDocumentation
 */

import type { ContextTokenCounter } from './token-counter.js';

/**
 * Layer-id discriminator. Mirrors the documented Layer 1-6
 * structure of the layered system prompt.
 *
 * @stable
 */
export type LayerId =
  | 'identity'
  | 'memoryMetadata'
  | 'activeRules'
  | 'workingBlocks'
  | 'activeSkills'
  | 'autoRecall';

/**
 * Default priority ladder. Higher priority means the layer is
 * preserved longer when the budget is tight.
 *
 * @stable
 */
export const DEFAULT_LAYER_PRIORITY: ReadonlyArray<LayerId> = Object.freeze([
  'identity',
  'memoryMetadata',
  'activeRules',
  'workingBlocks',
  'activeSkills',
  'autoRecall',
]);

/**
 * Single layer candidate fed to {@link allocate}. The `text` field
 * carries the rendered fragment; `cap` is the optional per-layer
 * upper bound (in tokens); `priority` overrides the default ladder
 * for advanced use cases.
 *
 * @stable
 */
export interface LayerCandidate {
  readonly id: LayerId;
  readonly text: string;
  readonly cap?: number;
  readonly priority?: number;
}

/**
 * Per-layer truncation mode used when the layer overflows its cap
 * or the global budget. `truncate` is the default; `drop` removes
 * the layer entirely when it would otherwise overflow.
 *
 * @stable
 */
export type OverflowMode = 'truncate' | 'drop';

/**
 * Output of {@link allocate} - one entry per surviving layer in
 * priority order, plus a `truncated` flag for observability.
 *
 * @stable
 */
export interface LayerAllocation {
  readonly id: LayerId;
  readonly text: string;
  readonly tokens: number;
  readonly truncated: boolean;
  readonly droppedTokens: number;
}

/**
 * Result of an allocator run.
 *
 * @stable
 */
export interface AllocationResult {
  readonly layers: ReadonlyArray<LayerAllocation>;
  readonly totalTokens: number;
  readonly budgetTokens: number;
  readonly overflowDropped: ReadonlyArray<LayerId>;
}

/**
 * Tags opened-but-not-closed in `text`, innermost-first. A heuristic
 * scanner sized for the engine's own XML-ish layer markup
 * (`<memory_blocks>`, `<memory_rules>`, ...) - self-closing tags are
 * skipped and an unmatched closer is ignored.
 */
function unclosedTags(text: string): string[] {
  const stack: string[] = [];
  const re = /<(\/?)([A-Za-z_][\w.-]*)(?:\s[^<>]*)?(\/?)>/g;
  let match = re.exec(text);
  while (match !== null) {
    const [, closing, name, selfClosing] = match;
    if (selfClosing !== '/' && name !== undefined) {
      if (closing === '/') {
        const idx = stack.lastIndexOf(name);
        if (idx !== -1) stack.splice(idx, 1);
      } else {
        stack.push(name);
      }
    }
    match = re.exec(text);
  }
  return stack.reverse();
}

/**
 * Snap a prefix cut to a structure-safe point (CE-16e): never end
 * inside a partially-emitted tag (`...<memory_blo`).
 */
function snapCut(kept: string): string {
  const lastOpen = kept.lastIndexOf('<');
  return lastOpen > kept.lastIndexOf('>') ? kept.slice(0, lastOpen) : kept;
}

/**
 * Truncate `text` to fit `maxTokens`, preserving the leading
 * portion and replacing the trailing portion with the literal
 * `[...truncated]` marker. The token estimate is computed via the
 * supplied `counter`; truncation falls back to character-based
 * trimming when the estimate is non-monotonic.
 *
 * Structure-aware (CE-16e): the cut never splits a tag, and block
 * tags the cut leaves open are re-closed after the marker, so a
 * capped layer of XML-ish markup (e.g. `<memory_blocks>`) stays
 * well-formed in the assembled prompt. Plain strings are unaffected.
 *
 * @stable
 */
export async function truncateToTokens(
  text: string,
  maxTokens: number,
  counter: ContextTokenCounter,
): Promise<{ readonly text: string; readonly tokens: number; readonly truncated: boolean }> {
  if (maxTokens <= 0) return { text: '', tokens: 0, truncated: text.length > 0 };
  const initial = await counter.countText(text);
  if (initial <= maxTokens) return { text, tokens: initial, truncated: false };
  const marker = '\n[...truncated]';
  const markerTokens = await counter.countText(marker);
  const targetTokens = Math.max(0, maxTokens - markerTokens);
  if (targetTokens <= 0) return { text: marker, tokens: markerTokens, truncated: true };
  // Approximate the cut point via the inverse of the heuristic
  // chars-per-token ratio. Falls back to repeated halving when the
  // ratio is non-monotonic for the supplied counter.
  let lo = 0;
  let hi = text.length;
  let bestCut = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const slice = text.slice(0, mid);
    const tokens = await counter.countText(slice);
    if (tokens <= targetTokens) {
      bestCut = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  let kept = snapCut(text.slice(0, bestCut));
  let closers = unclosedTags(kept)
    .map((t) => `</${t}>`)
    .join('');
  let truncated = `${kept}${marker}${closers.length > 0 ? `\n${closers}` : ''}`;
  let tokens = await counter.countText(truncated);
  // Re-closing may push past the cap - shave the kept body until the
  // whole thing (body + marker + closers) fits. Terminates: `kept`
  // shrinks by ≥1 char per pass, and the empty body fits by the
  // `targetTokens > 0` guard above.
  while (tokens > maxTokens && kept.length > 0) {
    kept = snapCut(kept.slice(0, kept.length - Math.ceil(kept.length * 0.1)));
    closers = unclosedTags(kept)
      .map((t) => `</${t}>`)
      .join('');
    truncated = `${kept}${marker}${closers.length > 0 ? `\n${closers}` : ''}`;
    tokens = await counter.countText(truncated);
  }
  return { text: truncated, tokens, truncated: true };
}

/**
 * Run the allocator. Layers are sorted by priority ascending (the
 * first layer is the highest priority); when the running total
 * exceeds the budget, lower-priority layers are first capped at
 * their per-layer `cap` (when set) and finally truncated to
 * whatever fits.
 *
 * @stable
 */
export async function allocate(
  layers: ReadonlyArray<LayerCandidate>,
  budgetTokens: number,
  counter: ContextTokenCounter,
  options: {
    readonly priority?: ReadonlyArray<LayerId>;
    readonly overflowMode?: OverflowMode;
  } = {},
): Promise<AllocationResult> {
  const priorityOrder = options.priority ?? DEFAULT_LAYER_PRIORITY;
  const overflowMode = options.overflowMode ?? 'truncate';
  const orderIndex = new Map<LayerId, number>();
  priorityOrder.forEach((id, idx) => {
    orderIndex.set(id, idx);
  });
  const sorted = [...layers].sort((a, b) => {
    const aPriority = a.priority ?? orderIndex.get(a.id) ?? 999;
    const bPriority = b.priority ?? orderIndex.get(b.id) ?? 999;
    return aPriority - bPriority;
  });

  // First pass: enforce per-layer caps (regardless of total budget).
  const capped: Array<{
    readonly candidate: LayerCandidate;
    text: string;
    tokens: number;
    truncated: boolean;
  }> = [];
  for (const candidate of sorted) {
    if (candidate.text.length === 0) {
      capped.push({ candidate, text: '', tokens: 0, truncated: false });
      continue;
    }
    if (candidate.cap !== undefined && candidate.cap >= 0) {
      const trimmed = await truncateToTokens(candidate.text, candidate.cap, counter);
      capped.push({
        candidate,
        text: trimmed.text,
        tokens: trimmed.tokens,
        truncated: trimmed.truncated,
      });
    } else {
      const tokens = await counter.countText(candidate.text);
      capped.push({ candidate, text: candidate.text, tokens, truncated: false });
    }
  }

  // Second pass: enforce the global budget. Walk the layers in
  // priority order, accumulating tokens; when the running total
  // exceeds the budget, the rest are dropped or truncated to fit.
  const budget = Math.max(0, budgetTokens);
  const layersOut: LayerAllocation[] = [];
  const overflowDropped: LayerId[] = [];
  let runningTotal = 0;
  for (const entry of capped) {
    if (entry.text.length === 0) {
      layersOut.push({
        id: entry.candidate.id,
        text: '',
        tokens: 0,
        truncated: false,
        droppedTokens: 0,
      });
      continue;
    }
    if (runningTotal + entry.tokens <= budget) {
      runningTotal += entry.tokens;
      layersOut.push({
        id: entry.candidate.id,
        text: entry.text,
        tokens: entry.tokens,
        truncated: entry.truncated,
        droppedTokens: 0,
      });
      continue;
    }
    const remaining = Math.max(0, budget - runningTotal);
    if (overflowMode === 'drop' || remaining === 0) {
      overflowDropped.push(entry.candidate.id);
      layersOut.push({
        id: entry.candidate.id,
        text: '',
        tokens: 0,
        truncated: false,
        droppedTokens: entry.tokens,
      });
      continue;
    }
    const trimmed = await truncateToTokens(entry.text, remaining, counter);
    runningTotal += trimmed.tokens;
    layersOut.push({
      id: entry.candidate.id,
      text: trimmed.text,
      tokens: trimmed.tokens,
      truncated: true,
      droppedTokens: entry.tokens - trimmed.tokens,
    });
  }

  return Object.freeze({
    layers: Object.freeze(layersOut),
    totalTokens: runningTotal,
    budgetTokens: budget,
    overflowDropped: Object.freeze(overflowDropped),
  });
}
