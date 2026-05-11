/**
 * `CausalityMonitor` — lateral-leak defense primitive that maintains
 * a per-`RunContext` `causalityChain` of bounded depth and refuses
 * to let an assistant message reference information about a denied
 * earlier action.
 *
 * The monitor is opt-in: agents declare `causalityMonitor:
 * { strictness, denialPatterns?, ... }` on `createAgent({...})`.
 * When the field is absent, the runtime instantiates a no-op monitor
 * that records nothing and never flags.
 *
 * @packageDocumentation
 */

import type { LateralLeakVector } from '@graphorin/core';

/**
 * Operator-tunable strictness level. Default `'detect-and-flag'`
 * for cloud-tier providers; `'detect'` for loopback providers;
 * `'off'` for v0.1-alpha backward compatibility.
 *
 * @stable
 */
export type CausalityMonitorStrictness = 'off' | 'detect' | 'detect-and-flag' | 'detect-and-block';

/**
 * Per-agent configuration accepted by `createAgent({ causalityMonitor })`.
 *
 * @stable
 */
export interface CausalityMonitorConfig {
  readonly strictness: CausalityMonitorStrictness;
  /** Maximum depth of the chain. Default `32`. */
  readonly maxChainDepth?: number;
  /** Operator-extensible denial patterns. */
  readonly denialPatterns?: ReadonlyArray<RegExp>;
  /**
   * When `true`, emit the chain on every `checkMessage(...)` call
   * (high-cardinality; opt-in for compliance audits). Default
   * `false` — only emit on detected leaks.
   */
  readonly auditAllChains?: boolean;
}

/**
 * Default denial-pattern catalogue. The agent runtime extends this
 * list when the operator supplies their own patterns.
 *
 * @stable
 */
export const DEFAULT_DENIAL_PATTERNS: ReadonlyArray<RegExp> = [
  /SecretAccessDenied/i,
  /ToolApprovalDenied/i,
  /HandoffPermissionDenied/i,
  /SandboxViolation/i,
];

/** Default chain depth when not specified. */
export const DEFAULT_MAX_CHAIN_DEPTH = 32;

/**
 * Result returned by {@link CausalityMonitor.checkMessage}.
 *
 * @stable
 */
export interface CausalityMonitorCheck {
  readonly leakDetected: boolean;
  readonly severity: 'info' | 'warn' | 'block';
  readonly causalityChain: ReadonlyArray<string>;
  readonly matchedPattern?: string;
  readonly decision: 'detect' | 'flag' | 'strip' | 'block';
  readonly vector: LateralLeakVector;
}

/**
 * In-memory primitive instantiated per `RunContext`. Bounded-depth
 * append discipline keeps the memory footprint trivial even on long
 * runs.
 *
 * @stable
 */
export class CausalityMonitor {
  readonly strictness: CausalityMonitorStrictness;
  readonly maxChainDepth: number;
  readonly denialPatterns: ReadonlyArray<RegExp>;
  readonly auditAllChains: boolean;
  #chain: string[] = [];

  constructor(cfg: CausalityMonitorConfig) {
    this.strictness = cfg.strictness;
    this.maxChainDepth = cfg.maxChainDepth ?? DEFAULT_MAX_CHAIN_DEPTH;
    this.denialPatterns = cfg.denialPatterns
      ? [...DEFAULT_DENIAL_PATTERNS, ...cfg.denialPatterns]
      : DEFAULT_DENIAL_PATTERNS;
    this.auditAllChains = cfg.auditAllChains ?? false;
  }

  /** Snapshot the current causality chain. */
  get chain(): ReadonlyArray<string> {
    return this.#chain.slice();
  }

  /**
   * Append an entry to the causality chain, dropping the oldest
   * when the chain exceeds `maxChainDepth`. Bounded-length, no PII,
   * no secret values — entries are short opaque strings like
   * `tool:slack-notify`, `tool.error:SecretAccessDenied`,
   * `subagent:research-east`, `compaction:auto-trigger`.
   */
  recordCall(entry: string): void {
    if (this.strictness === 'off') return;
    if (entry.length === 0) return;
    this.#chain.push(entry);
    if (this.#chain.length > this.maxChainDepth) {
      this.#chain.shift();
    }
  }

  /** Reset the chain — e.g. on `agent.run` boundary. */
  reset(): void {
    this.#chain = [];
  }

  /**
   * Inspect a candidate assistant-visible string and return whether
   * the lateral-leak defense should fire. Pure decision based on
   * the current chain + the operator-extensible denial patterns.
   */
  checkMessage(content: string): CausalityMonitorCheck {
    if (this.strictness === 'off') {
      return {
        leakDetected: false,
        severity: 'info',
        causalityChain: [],
        decision: 'detect',
        vector: 'causality-laundering',
      };
    }
    const chainHasDenial = this.#chain.some((entry) =>
      this.denialPatterns.some((pat) => pat.test(entry)),
    );
    if (!chainHasDenial) {
      return {
        leakDetected: false,
        severity: 'info',
        causalityChain: this.chain,
        decision: 'detect',
        vector: 'causality-laundering',
      };
    }
    let matchedPattern: string | undefined;
    for (const pat of this.denialPatterns) {
      if (pat.test(content)) {
        matchedPattern = pat.source;
        break;
      }
    }
    const leakDetected = matchedPattern !== undefined;
    if (!leakDetected) {
      return {
        leakDetected: false,
        severity: 'info',
        causalityChain: this.chain,
        decision: 'detect',
        vector: 'causality-laundering',
      };
    }
    switch (this.strictness) {
      case 'detect':
        return {
          leakDetected: true,
          severity: 'info',
          causalityChain: this.chain,
          ...(matchedPattern !== undefined ? { matchedPattern } : {}),
          decision: 'detect',
          vector: 'causality-laundering',
        };
      case 'detect-and-flag':
        return {
          leakDetected: true,
          severity: 'warn',
          causalityChain: this.chain,
          ...(matchedPattern !== undefined ? { matchedPattern } : {}),
          decision: 'flag',
          vector: 'causality-laundering',
        };
      case 'detect-and-block':
        return {
          leakDetected: true,
          severity: 'block',
          causalityChain: this.chain,
          ...(matchedPattern !== undefined ? { matchedPattern } : {}),
          decision: 'block',
          vector: 'causality-laundering',
        };
      default: {
        const _exhaustive: never = this.strictness;
        void _exhaustive;
        return {
          leakDetected: false,
          severity: 'info',
          causalityChain: this.chain,
          decision: 'detect',
          vector: 'causality-laundering',
        };
      }
    }
  }

  /**
   * Drain the chain to the audit log on `agent.run` completion or
   * `agent.abort`. The runtime supplies the audit emitter — the
   * primitive itself is storage-agnostic.
   */
  flush(reason: 'agent.run.complete' | 'agent.abort'): {
    readonly chain: ReadonlyArray<string>;
    readonly reason: 'agent.run.complete' | 'agent.abort';
  } {
    return { chain: this.chain, reason };
  }
}
