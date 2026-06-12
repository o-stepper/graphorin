/**
 * Provenance / taint types for the data-flow policy engine (P1-3).
 *
 * The engine derives *provenance* from the metadata Graphorin already
 * attaches to every registered tool — its {@link ToolTrustClass}, its
 * {@link ToolSource}, and its declared {@link Sensitivity} — and uses it
 * to enforce data-flow rules at the executor boundary rather than relying
 * on pattern scans alone. The goal is to defuse the *lethal trifecta*:
 * untrusted content + access to private data + an exfiltration/mutation
 * sink. When all three are present in one run, a prompt injection hidden
 * in the untrusted content can drive the sink. The policy makes that flow
 * fail closed (or, in shadow mode, merely report) unless an operator has
 * explicitly declassified it.
 *
 * Everything in this module is pure (no I/O, no clock, no network) so it
 * can be unit-tested exhaustively and embedded in any enforcement point —
 * the synchronous executor hot path or a code-mode interpreter alike.
 *
 * @packageDocumentation
 */

import type { Sensitivity, SideEffectClass, ToolSource, ToolTrustClass } from '@graphorin/core';

/**
 * Operating mode for {@link DataFlowPolicy}.
 *
 * - `'off'`     — disabled; every flow is allowed (the engine is never
 *   constructed in this mode by the agent, but the value exists so a
 *   config can disable the feature without becoming `undefined`).
 * - `'shadow'`  — audit-only: tainted flows are *flagged* (an audit row +
 *   counter) but never blocked. Ship this first to surface false
 *   positives against real traffic before enforcing.
 * - `'enforce'` — tainted flows are *blocked* (the sink does not run)
 *   unless the sink is operator-declassified.
 *
 * @stable
 */
export type DataFlowMode = 'off' | 'shadow' | 'enforce';

/**
 * The kind of tainted data flow the policy detected at a sink.
 *
 * - `'untrusted-to-sink'` — untrusted content (or a verbatim chunk of it)
 *   is being passed *into* the sink's arguments. The precise, low
 *   false-positive signal: direct exfiltration of untrusted content.
 * - `'lethal-trifecta'`   — the conservative signal: a sink fires while
 *   both untrusted content **and** secret-tier data have entered the run,
 *   even when no verbatim carry is provable. Catches the paraphrased
 *   "untrusted instruction drives a secret exfiltration" case at the cost
 *   of more false positives (hence shadow-mode-first + declassification).
 *
 * @stable
 */
export type TaintFlowKind = 'untrusted-to-sink' | 'lethal-trifecta';

/**
 * Provenance label derived from a tool's registration metadata. Describes
 * whether the tool's *output* should be treated as untrusted and/or
 * sensitive for the purposes of downstream sink checks.
 *
 * @stable
 */
export interface TaintLabel {
  /** Resolved trust class of the producing tool. */
  readonly trustClass: ToolTrustClass;
  /** The producing tool's source kind (`'unknown'` when unattributed). */
  readonly sourceKind: ToolSource['kind'] | 'unknown';
  /** The producing tool's declared sensitivity (`'unknown'` when absent). */
  readonly sensitivity: Sensitivity | 'unknown';
  /**
   * `true` when the output originates from an untrusted source
   * (`mcp-derived`, `web-search`, `skill-untrusted`) — content a prompt
   * injection could be hidden in.
   */
  readonly untrusted: boolean;
  /**
   * `true` when the output carries secret-tier data (`sensitivity:
   * 'secret'`). Only the `'secret'` tier counts: `'internal'` is the
   * default for ordinary user content, so treating it as sensitive would
   * make the trifecta gate fire on virtually every run.
   */
  readonly sensitive: boolean;
}

/**
 * Result of probing a candidate sink's arguments against a
 * {@link TaintLedger}.
 *
 * @stable
 */
export interface ArgsTaintProbe {
  /**
   * `true` when the serialized arguments share a substantial verbatim
   * span with previously-recorded untrusted output (best-effort: catches
   * verbatim / near-verbatim forwarding, not paraphrase).
   */
  readonly carriesUntrustedVerbatim: boolean;
  /** Untrusted source kinds whose recorded output matched the arguments. */
  readonly matchedSourceKinds: ReadonlyArray<string>;
}

/**
 * Per-run taint state. Records the provenance of each tool output and
 * answers two questions a sink check needs: *has untrusted/sensitive
 * content entered this run?* and *do these specific arguments carry
 * untrusted content verbatim?*
 *
 * Implementations are stateful and run-scoped; create one per run.
 *
 * @stable
 */
export interface TaintLedger {
  /** Record one tool output's provenance (and its text, if untrusted). */
  recordOutput(label: TaintLabel, outputText: string): void;
  /** Probe a sink's serialized arguments for verbatim untrusted carry. */
  inspectArgs(argsText: string): ArgsTaintProbe;
  /** `true` once any untrusted-source output has entered the run. */
  readonly untrustedSeen: boolean;
  /** `true` once any secret-tier output has entered the run. */
  readonly sensitiveSeen: boolean;
  /** Distinct untrusted source kinds observed so far. */
  readonly untrustedSourceKinds: ReadonlyArray<string>;
  /**
   * Coarse, serializable summary of the load-bearing trifecta-gate signal —
   * the `untrusted`/`sensitive`/source-kind flags only, **never** the tracked
   * verbatim spans (those are untrusted text and must not be persisted). Used
   * to rehydrate the ledger across a suspend/resume so the sink gate is not
   * silently weakened on the HITL boundary (AG-19).
   */
  snapshot(): TaintLedgerSnapshot;
}

/**
 * Serializable coarse summary of a {@link TaintLedger} — the trifecta-gate
 * flags only. Round-trips through `createTaintLedger({ initial })`. Carries no
 * untrusted text content, so it is safe to persist in a `RunState`.
 *
 * @stable
 */
export interface TaintLedgerSnapshot {
  readonly untrustedSeen: boolean;
  readonly sensitiveSeen: boolean;
  readonly untrustedSourceKinds: ReadonlyArray<string>;
}

/**
 * Configuration for {@link createDataFlowPolicy}. Also the shape an agent
 * accepts on `AgentConfig.dataFlowPolicy`.
 *
 * @stable
 */
export interface DataFlowPolicyConfig {
  /** Enforcement mode. See {@link DataFlowMode}. */
  readonly mode: DataFlowMode;
  /**
   * When `true` (the default), also gate on the conservative
   * {@link TaintFlowKind | lethal-trifecta} signal, not only on verbatim
   * `untrusted-to-sink` carry. Set `false` to gate exclusively on
   * provable verbatim flow (fewer false positives, weaker guarantee).
   */
  readonly guardTrifecta?: boolean;
  /**
   * Sensitivity tiers that arm the lethal-trifecta `sensitive` leg
   * (SDF-8). Default `['secret']` (out-of-the-box behaviour is
   * byte-identical — only secret-tagged content counts). Set e.g.
   * `['secret', 'internal']` so ordinary user/PII content (default
   * `'internal'`) also counts; the agent's guard builder threads this
   * into `deriveTaintLabel`. The verbatim `untrusted-to-sink` leg is
   * independent of this option.
   */
  readonly sensitiveTiers?: ReadonlyArray<import('@graphorin/core').Sensitivity>;
  /**
   * Sink tool names pre-authorized by the operator to receive tainted
   * data. A tainted flow into one of these is audited as `declassified`
   * and allowed even in `'enforce'` mode — the explicit, audited escape
   * hatch for known-good flows.
   */
  readonly declassifySinks?: ReadonlyArray<string>;
  /**
   * Minimum length of a shared verbatim span (in normalized characters)
   * for the ledger to treat a sink's arguments as carrying untrusted
   * content. Lower = more sensitive (more false positives), clamped up
   * to an 8-char floor below which the probe cannot be meaningful
   * (SDF-5). Default `20`.
   */
  readonly minSpanLength?: number;
}

/**
 * The signal a {@link DataFlowPolicy} evaluates for one candidate sink
 * call. Populated by the enforcement point from the resolved tool's
 * metadata plus the run's {@link TaintLedger}.
 *
 * @stable
 */
export interface DataFlowEvaluation {
  /** Name of the sink tool about to run. */
  readonly toolName: string;
  /** The sink's resolved side-effect class. */
  readonly sideEffectClass: SideEffectClass;
  /** `true` when the sink's arguments carry untrusted content verbatim. */
  readonly carriesUntrustedVerbatim: boolean;
  /** `true` when untrusted content has entered the run. */
  readonly untrustedSeen: boolean;
  /** `true` when secret-tier content has entered the run. */
  readonly sensitiveSeen: boolean;
  /** Untrusted source kinds relevant to this flow (matched + observed). */
  readonly sourceKinds: ReadonlyArray<string>;
}

/**
 * The details attached to a non-`allow` {@link DataFlowDecision}.
 *
 * @stable
 */
export interface DataFlowFinding {
  /** Which flow tripped the policy. */
  readonly flow: TaintFlowKind;
  /** Human-readable, *metadata-only* explanation (never raw arg/output bytes). */
  readonly reason: string;
  /** Untrusted source kinds implicated in the flow. */
  readonly sourceKinds: ReadonlyArray<string>;
}

/**
 * The verdict {@link DataFlowPolicy.evaluate} returns for a sink call.
 *
 * - `'allow'`       — no tainted flow (or the policy is off / the tool is
 *   not a sink); proceed silently.
 * - `'flag'`        — tainted flow detected in `'shadow'` mode: audit but
 *   proceed.
 * - `'declassify'`  — tainted flow into an operator-declassified sink:
 *   audit and proceed (the audited escape hatch).
 * - `'block'`       — tainted flow in `'enforce'` mode: do not run the
 *   sink; surface a `dataflow_policy_blocked` error.
 *
 * @stable
 */
export type DataFlowDecision =
  | { readonly action: 'allow' }
  | ({ readonly action: 'flag' | 'declassify' | 'block' } & DataFlowFinding);

/**
 * The data-flow policy engine. Stateless and pure: all run-scoped state
 * lives in the {@link TaintLedger} the caller threads in via
 * {@link DataFlowEvaluation}.
 *
 * @stable
 */
export interface DataFlowPolicy {
  /** The configured mode (mirrors the constructor input). */
  readonly mode: DataFlowMode;
  /** Decide what to do about one candidate sink call. */
  evaluate(evaluation: DataFlowEvaluation): DataFlowDecision;
}
