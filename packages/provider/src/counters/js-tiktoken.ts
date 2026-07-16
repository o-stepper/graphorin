/**
 * `JsTiktokenCounter` - default counter for OpenAI / OpenAI-compatible
 * models. The package depends on the `js-tiktoken` peer; when the peer
 * is missing, instantiation throws at first call rather than silently
 * downgrading to a heuristic.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

import { serialiseMessageForCount, serializedToString } from './serialize.js';

/**
 * Loose shape of a `js-tiktoken` encoding. Matches the public
 * `Tiktoken` instance returned by `getEncoding(...)` in the upstream
 * package (we only use `encode` / `name`).
 *
 * @internal
 */
interface TiktokenEncoding {
  readonly name?: string;
  encode(
    text: string,
    allowedSpecial?: readonly string[] | 'all',
    disallowedSpecial?: readonly string[] | 'all',
  ): { length: number };
}

/**
 * PROVIDER-CT-01: js-tiktoken's `encode` defaults `disallowedSpecial` to
 * `'all'` and THROWS when the input contains a special-token sequence
 * (e.g. `<|endoftext|>`). For token COUNTING of arbitrary user/model text
 * that is a crash on ordinary input, so we disallow nothing and treat any
 * such sequence as regular text (`allowedSpecial=[]` => encoded as its BPE
 * pieces, not as one special token).
 */
function encodeCount(enc: TiktokenEncoding, text: string): number {
  return enc.encode(text, [], []).length;
}

interface TiktokenModule {
  getEncoding(name: string): TiktokenEncoding;
  encodingForModel?: (model: string) => TiktokenEncoding;
}

/**
 * Options for {@link JsTiktokenCounter}.
 *
 * @stable
 */
export interface JsTiktokenCounterOptions {
  /** Encoding name (`'cl100k_base'`, `'o200k_base'`, …). Default `'cl100k_base'`. */
  readonly encoding?: string;
  /** Optional model id used by `encodingForModel`. Falls back to the explicit `encoding`. */
  readonly modelId?: string;
  /**
   * Override the dynamically-loaded module. Used by tests to inject a
   * stub without taking the real `js-tiktoken` peer dependency.
   */
  readonly moduleOverride?: TiktokenModule;
  /** Identifier carried on the produced counter. */
  readonly id?: string;
}

let cachedModule: TiktokenModule | null = null;

/**
 * Counter that delegates to the `js-tiktoken` package. Caches the
 * dynamically-loaded module per process; tests use `moduleOverride`
 * to supply a fixture-shaped substitute.
 *
 * @stable
 */
export class JsTiktokenCounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #encoding: string;
  readonly #modelId?: string;
  readonly #moduleOverride?: TiktokenModule;
  #encoder: TiktokenEncoding | null = null;

  constructor(options: JsTiktokenCounterOptions = {}) {
    this.#encoding = options.encoding ?? 'cl100k_base';
    if (options.modelId !== undefined) this.#modelId = options.modelId;
    if (options.moduleOverride !== undefined) this.#moduleOverride = options.moduleOverride;
    this.id = options.id ?? `js-tiktoken@${this.#encoding}`;
    this.version = `js-tiktoken-${this.#encoding}-v1`;
  }

  async count(messages: ReadonlyArray<Message>): Promise<number> {
    const enc = await this.#getEncoder();
    let total = 0;
    for (const msg of messages) {
      const serialised = serialiseMessageForCount(msg);
      total += encodeCount(enc, serializedToString(serialised));
    }
    return total;
  }

  async countText(text: string): Promise<number> {
    if (text.length === 0) return 0;
    const enc = await this.#getEncoder();
    return encodeCount(enc, text);
  }

  async #getEncoder(): Promise<TiktokenEncoding> {
    if (this.#encoder !== null) return this.#encoder;
    const mod = this.#moduleOverride ?? (await loadTiktokenModule());
    if (this.#modelId !== undefined && mod.encodingForModel !== undefined) {
      try {
        this.#encoder = mod.encodingForModel(this.#modelId);
        return this.#encoder;
      } catch {
        // Fall through to the explicit encoding.
      }
    }
    this.#encoder = mod.getEncoding(this.#encoding);
    return this.#encoder;
  }
}

async function loadTiktokenModule(): Promise<TiktokenModule> {
  if (cachedModule !== null) return cachedModule;
  let mod: TiktokenModule;
  try {
    mod = (await import('js-tiktoken')) as TiktokenModule;
  } catch (cause) {
    throw new Error(
      "[graphorin/provider] JsTiktokenCounter requires the 'js-tiktoken' peer dependency. " +
        'Install it with `pnpm add js-tiktoken` or pass moduleOverride for tests.',
      { cause },
    );
  }
  if (typeof mod.getEncoding !== 'function') {
    throw new Error(
      '[graphorin/provider] JsTiktokenCounter: installed js-tiktoken does not expose getEncoding().',
    );
  }
  cachedModule = mod;
  return cachedModule;
}

/**
 * Test-only hook that resets the cached `js-tiktoken` module loader.
 *
 * @internal
 */
export function __resetTiktokenCache(): void {
  cachedModule = null;
}
