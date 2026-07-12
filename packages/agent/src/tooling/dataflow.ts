/**
 * Adapter: build the executor's {@link DataFlowGuard} from a
 * {@link DataFlowPolicyConfig} (WI-12 / P1-3).
 *
 * Bridges `@graphorin/security`'s pure taint engine (policy + per-run
 * ledger + provenance derivation) to the `@graphorin/tools` executor hook.
 * The executor calls {@link DataFlowGuard.inspect} as a sink gate and
 * {@link DataFlowGuard.record} after every successful output; this adapter
 * routes each call to the right run's {@link TaintLedger} and maps the
 * security {@link DataFlowDecision} onto the executor's
 * {@link DataFlowVerdict} (so the executor takes no security dependency).
 *
 * Because the agent builds one executor that serves the whole run (and the
 * code-mode quiet executor too), the guard keeps a per-run ledger map.
 * The live ledger (with its verbatim-probe spans) is in-memory and
 * run-scoped, but its summary survives suspend/resume: the agent persists
 * `snapshotLedger()` onto `RunState.taintSummary` on every exit and
 * re-seeds via `seedLedger()` on resume (AG-19 / agent-08). The summary
 * carries the coarse flags plus ONE-WAY span-tile hashes (C6) - never
 * untrusted text - so the verbatim probe re-arms for pre-suspend content
 * at tile granularity while live spans keep full sensitivity. The map is bounded by
 * insertion-order eviction so a long-lived agent never leaks ledgers.
 *
 * @packageDocumentation
 */

import {
  createDataFlowPolicy,
  createTaintLedger,
  type DataFlowPolicyConfig,
  deriveTaintLabel,
  isUntrustedTrustClass,
  type TaintLedger,
  type TaintLedgerSnapshot,
} from '@graphorin/security/dataflow';
import { containsPii } from '@graphorin/security/guardrails';
import type {
  DataFlowGuard,
  DataFlowInspectInput,
  DataFlowRecordInput,
  DataFlowVerdict,
} from '@graphorin/tools/executor';
import type { InboundTaintSeed } from '../types.js';

/** Max concurrent run ledgers retained before evicting the oldest. */
const MAX_TRACKED_RUNS = 128;

/** Serialize tool-call args to text for the verbatim-carry probe. */
function stringifyArgs(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

/**
 * Build a {@link DataFlowGuard} backed by `@graphorin/security`'s taint
 * engine. Returns a guard whose `inspect`/`record` operate on a per-run
 * ledger keyed by `runContext.runId`.
 *
 * @internal
 */
/**
 * The executor's {@link DataFlowGuard} plus AG-19 ledger-persistence hooks the
 * agent uses to carry the coarse taint summary across a suspend/resume.
 */
export interface DataFlowGuardWithLedgers extends DataFlowGuard {
  /** Read a run's coarse taint summary to persist on suspend (or `undefined`). */
  snapshotLedger(runId: string): TaintLedgerSnapshot | undefined;
  /** Pre-seed a run's ledger from a persisted summary on resume. */
  seedLedger(runId: string, summary: TaintLedgerSnapshot): void;
  /**
   * C6: record the model's own step output as derived-untrusted (no-op on
   * an untainted run). Makes the verbatim probe catch args the model
   * copied from its own untrusted-derived phrasing, and feeds the
   * `derivedTaint: 'strict'` policy leg.
   */
  recordAssistant(runId: string, text: string): void;
  /**
   * B1.5: stamp message-borne untrusted input (channel inbound) into a
   * run's ledger. Called at run init, before the first step, from the
   * `AgentCallOptions.inboundTaint` seed. Widen-only.
   */
  recordInboundMessage(runId: string, seed: InboundTaintSeed): void;
  /**
   * B4 (item 14): evaluate the run's OUTGOING assistant text as a
   * sink (stable sink id `'assistant-output'`, declassifiable via
   * `declassifySinks`). Called by the commit gate BEFORE the message
   * is appended; `'block'` replaces the outgoing text with a notice.
   */
  inspectAssistantOutput(runId: string, text: string): DataFlowVerdict;
}

export function buildDataFlowGuard(config: DataFlowPolicyConfig): DataFlowGuardWithLedgers {
  const policy = createDataFlowPolicy(config);
  // FIDES-lattice (SDF-8): when treatPiiAsSensitive is on, feed the PII catalogue
  // into the ledger so PII reads arm the trifecta `sensitive` leg. Default off.
  const ledgerOpts = {
    ...(config.minSpanLength !== undefined ? { minSpanLength: config.minSpanLength } : {}),
    ...(config.treatPiiAsSensitive === true ? { piiSensitivity: containsPii } : {}),
  };
  const ledgers = new Map<string, TaintLedger>();

  function ledgerFor(runId: string): TaintLedger {
    const existing = ledgers.get(runId);
    if (existing !== undefined) return existing;
    const ledger = createTaintLedger(ledgerOpts);
    ledgers.set(runId, ledger);
    while (ledgers.size > MAX_TRACKED_RUNS) {
      const oldest = ledgers.keys().next().value;
      if (oldest === undefined) break;
      ledgers.delete(oldest);
    }
    return ledger;
  }

  return {
    inspect(input: DataFlowInspectInput): DataFlowVerdict {
      const ledger = ledgerFor(input.runContext.runId);
      const probe = ledger.inspectArgs(stringifyArgs(input.args));
      const decision = policy.evaluate({
        toolName: input.toolName,
        sideEffectClass: input.sideEffectClass,
        carriesUntrustedVerbatim: probe.carriesUntrustedVerbatim,
        untrustedSeen: ledger.untrustedSeen,
        sensitiveSeen: ledger.sensitiveSeen,
        sourceKinds:
          probe.matchedSourceKinds.length > 0
            ? probe.matchedSourceKinds
            : ledger.untrustedSourceKinds,
      });
      if (decision.action === 'allow') return { action: 'allow' };
      return {
        action: decision.action,
        flow: decision.flow,
        reason: decision.reason,
        sourceKinds: decision.sourceKinds,
      };
    },

    record(input: DataFlowRecordInput): void {
      const ledger = ledgerFor(input.runContext.runId);
      const derived = deriveTaintLabel({
        trustClass: input.trustClass,
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
        // SDF-8: widen the trifecta `sensitive` leg to the operator's
        // configured tiers (default secret-only ⇒ byte-identical).
        ...(config.sensitiveTiers !== undefined ? { sensitiveTiers: config.sensitiveTiers } : {}),
      });
      // C6: a ToolReturn taint override only ever WIDENS the derived
      // label - a first-party recall tool can mark quarantined content
      // untrusted, but nothing can launder an untrusted tool's output.
      const override = input.taintOverride;
      const label =
        override === undefined
          ? derived
          : {
              ...derived,
              untrusted: derived.untrusted || override.untrusted === true,
              sensitive: derived.sensitive || override.sensitive === true,
              ...(override.untrusted === true && override.sourceKind !== undefined
                ? { sourceKind: override.sourceKind }
                : {}),
            };
      ledger.recordOutput(label, input.outputText);
    },

    recordAssistant(runId: string, text: string): void {
      if (text.length === 0) return;
      ledgerFor(runId).recordAssistantOutput?.(text);
    },

    inspectAssistantOutput(runId: string, text: string): DataFlowVerdict {
      const ledger = ledgerFor(runId);
      const probe = ledger.inspectArgs(text);
      const decision = policy.evaluate({
        toolName: 'assistant-output',
        sinkKind: 'assistant-output',
        // The reply surface has no side-effect class of its own; the
        // sinkKind makes it a sink regardless, and 'read-only' keeps
        // the field honest (nothing mutates).
        sideEffectClass: 'read-only',
        carriesUntrustedVerbatim: probe.carriesUntrustedVerbatim,
        untrustedSeen: ledger.untrustedSeen,
        sensitiveSeen: ledger.sensitiveSeen,
        sourceKinds:
          probe.matchedSourceKinds.length > 0
            ? probe.matchedSourceKinds
            : ledger.untrustedSourceKinds,
      });
      if (decision.action === 'allow') return { action: 'allow' };
      return {
        action: decision.action,
        flow: decision.flow,
        reason: decision.reason,
        sourceKinds: decision.sourceKinds,
      };
    },

    recordInboundMessage(runId: string, seed: InboundTaintSeed): void {
      // The label mirrors deriveTaintLabel for the 'channel-inbound'
      // trust class; `untrusted` is sourced from the single shared
      // predicate so the taint engine and the Rule-of-Two leg can
      // never disagree about channel input.
      ledgerFor(runId).recordInboundMessage?.(
        {
          trustClass: 'channel-inbound',
          sourceKind: seed.sourceKind ?? 'channel-inbound',
          sensitivity: 'unknown',
          untrusted: isUntrustedTrustClass('channel-inbound'),
          sensitive: seed.sensitive === true,
        },
        seed.text,
      );
    },

    // AG-19: snapshot/rehydrate the run's coarse taint summary across a
    // suspend/resume so the sink gate is not silently un-gated on the HITL
    // boundary. Only the load-bearing flags cross the boundary - never spans.
    snapshotLedger(runId: string): TaintLedgerSnapshot | undefined {
      return ledgers.get(runId)?.snapshot();
    },
    seedLedger(runId: string, summary: TaintLedgerSnapshot): void {
      ledgers.set(runId, createTaintLedger({ ...ledgerOpts, initial: summary }));
    },
  };
}
