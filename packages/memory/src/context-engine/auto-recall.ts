/**
 * Auto-recall heuristic — opt-in regex-based pre-call that injects
 * the top-K facts (and/or episodes) into Layer 6 when the last user
 * message matches one of the configured trigger phrases.
 *
 * The framework ships English defaults; per-locale trigger
 * phrases extend the default via {@link defineContextLocalePack}.
 * Application code can also register a fully-custom strategy via
 * {@link defineAutoRecallStrategy}.
 *
 * @packageDocumentation
 */

import type { ContextLocalePack } from './locale-packs/index.js';

/**
 * Per-call scope passed to a custom strategy.
 *
 * @stable
 */
export interface AutoRecallStrategyContext {
  readonly locale: string;
  readonly lastUserMessage: string;
}

/**
 * Outcome of a strategy invocation.
 *
 * @stable
 */
export interface AutoRecallTriggerResult {
  readonly factsTriggered: boolean;
  readonly episodesTriggered: boolean;
  /** Optional reason surfaced in spans / metadata. */
  readonly reason?: string;
}

/**
 * Pluggable strategy signature.
 *
 * @stable
 */
export type AutoRecallStrategy = (ctx: AutoRecallStrategyContext) => AutoRecallTriggerResult;

/**
 * Build a locale-driven heuristic strategy. The default for every
 * configured locale.
 *
 * @stable
 */
export function defaultLocaleHeuristicStrategy(pack: ContextLocalePack): AutoRecallStrategy {
  const factTriggers = pack.autoRecallTriggers.factTriggers;
  const episodeTriggers = pack.autoRecallTriggers.episodeTriggers;
  return (ctx) => {
    const text = ctx.lastUserMessage ?? '';
    if (text.length === 0) {
      return { factsTriggered: false, episodesTriggered: false };
    }
    const factsTriggered = factTriggers.some((re) => re.test(text));
    const episodesTriggered = episodeTriggers.some((re) => re.test(text));
    if (factsTriggered || episodesTriggered) {
      return {
        factsTriggered,
        episodesTriggered,
        reason: 'locale-heuristic-trigger-matched',
      };
    }
    return { factsTriggered: false, episodesTriggered: false };
  };
}

/**
 * Builder for application-supplied custom strategies. Accepts a
 * raw function and returns a tagged version so the engine can
 * surface the strategy name on spans.
 *
 * @stable
 */
export function defineAutoRecallStrategy(opts: {
  readonly id: string;
  readonly evaluate: AutoRecallStrategy;
}): AutoRecallStrategy & { readonly id: string } {
  if (typeof opts.id !== 'string' || opts.id.length === 0) {
    throw new TypeError(
      '[graphorin/memory] defineAutoRecallStrategy: `id` must be a non-empty string.',
    );
  }
  if (typeof opts.evaluate !== 'function') {
    throw new TypeError(
      '[graphorin/memory] defineAutoRecallStrategy: `evaluate` must be a function.',
    );
  }
  const wrapped = ((ctx: AutoRecallStrategyContext) => opts.evaluate(ctx)) as AutoRecallStrategy & {
    readonly id: string;
  };
  Object.defineProperty(wrapped, 'id', { value: opts.id, enumerable: true });
  return wrapped;
}
