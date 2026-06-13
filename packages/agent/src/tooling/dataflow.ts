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
 * Taint state is in-memory and run-scoped; like `tool_search` promotion it
 * is **not** persisted across a suspend/resume. The map is bounded by
 * insertion-order eviction so a long-lived agent never leaks ledgers.
 *
 * @packageDocumentation
 */

import {
  createDataFlowPolicy,
  createTaintLedger,
  type DataFlowPolicyConfig,
  deriveTaintLabel,
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
      const label = deriveTaintLabel({
        trustClass: input.trustClass,
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
        // SDF-8: widen the trifecta `sensitive` leg to the operator's
        // configured tiers (default secret-only ⇒ byte-identical).
        ...(config.sensitiveTiers !== undefined ? { sensitiveTiers: config.sensitiveTiers } : {}),
      });
      ledger.recordOutput(label, input.outputText);
    },

    // AG-19: snapshot/rehydrate the run's coarse taint summary across a
    // suspend/resume so the sink gate is not silently un-gated on the HITL
    // boundary. Only the load-bearing flags cross the boundary — never spans.
    snapshotLedger(runId: string): TaintLedgerSnapshot | undefined {
      return ledgers.get(runId)?.snapshot();
    },
    seedLedger(runId: string, summary: TaintLedgerSnapshot): void {
      ledgers.set(runId, createTaintLedger({ ...ledgerOpts, initial: summary }));
    },
  };
}
