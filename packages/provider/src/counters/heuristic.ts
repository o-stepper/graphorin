/**
 * Conservative `chars / N` token-count estimator. Used as the fallback
 * for unknown providers; emits exactly one WARN per unique
 * `(provider, model)` tuple per process so operators are nudged
 * toward a precise counter.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

import { serialiseMessageForCount, serializedToString } from './serialize.js';

/**
 * Options for {@link HeuristicCounter}.
 *
 * @stable
 */
export interface HeuristicCounterOptions {
  /** Average characters per token. Defaults to `4` (latin-1 estimate). */
  readonly charsPerToken?: number;
  /** Identifier carried on the produced counter. */
  readonly id?: string;
  /** Optional model hint surfaced in the WARN message. */
  readonly modelId?: string;
  /** Optional sink. Defaults to `console.warn`. */
  readonly logger?: (message: string, meta?: object) => void;
}

const WARNED = new Set<string>();

/**
 * Counter that estimates tokens via simple character division. The
 * estimator is deterministic and side-effect-free apart from the
 * one-time WARN.
 *
 * @stable
 */
export class HeuristicCounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #charsPerToken: number;
  readonly #modelId?: string;
  readonly #logger: (message: string, meta?: object) => void;
  #warnedOnce = false;

  constructor(options: HeuristicCounterOptions = {}) {
    const charsPerToken = options.charsPerToken ?? 4;
    if (!(charsPerToken > 0)) {
      throw new RangeError('HeuristicCounter: charsPerToken must be > 0.');
    }
    this.#charsPerToken = charsPerToken;
    this.id = options.id ?? `heuristic@${charsPerToken}cpt`;
    this.version = `heuristic-${charsPerToken}-cpt-v1`;
    if (options.modelId !== undefined) this.#modelId = options.modelId;
    this.#logger = options.logger ?? defaultLogger;
  }

  async count(messages: ReadonlyArray<Message>): Promise<number> {
    this.#warnIfNeeded();
    let total = 0;
    for (const msg of messages) {
      const serialised = serialiseMessageForCount(msg);
      total += this.#estimate(serializedToString(serialised));
    }
    return total;
  }

  async countText(text: string): Promise<number> {
    this.#warnIfNeeded();
    return this.#estimate(text);
  }

  #estimate(text: string): number {
    if (text.length === 0) return 0;
    return Math.ceil(text.length / this.#charsPerToken);
  }

  #warnIfNeeded(): void {
    if (this.#warnedOnce) return;
    const key = `${this.id}::${this.#modelId ?? 'unknown'}`;
    if (WARNED.has(key)) {
      this.#warnedOnce = true;
      return;
    }
    WARNED.add(key);
    this.#warnedOnce = true;
    this.#logger(
      `[graphorin/provider] heuristic token counter active (${this.id}); accuracy is approximate (~chars/${this.#charsPerToken}).`,
      this.#modelId !== undefined ? { modelId: this.#modelId } : {},
    );
  }
}

function defaultLogger(message: string, meta?: object): void {
  if (meta !== undefined) console.warn(message, meta);
  else console.warn(message);
}

/**
 * Test-only hook that resets the per-process WARN cache.
 *
 * @internal
 */
export function __resetHeuristicWarnCache(): void {
  WARNED.clear();
}
