/**
 * Provenance / taint-based data-flow policy for `@graphorin/security`
 * (P1-3, toward CaMeL).
 *
 * Enforces data-flow rules at a tool-execution boundary using the
 * provenance Graphorin already tracks (trust class + source + sensitivity)
 * rather than pattern scans alone, defusing the lethal trifecta. Pure and
 * I/O-free; the enforcement point (the `@graphorin/tools` executor, via
 * the agent runtime) threads a per-run {@link TaintLedger} through and acts
 * on the {@link DataFlowPolicy} verdict.
 *
 * @packageDocumentation
 */

export { deriveTaintLabel, isUntrustedTrustClass } from './derive.js';
export { createTaintLedger } from './ledger.js';
export { createDataFlowPolicy } from './policy.js';
export type {
  ArgsTaintProbe,
  DataFlowDecision,
  DataFlowEvaluation,
  DataFlowFinding,
  DataFlowMode,
  DataFlowPolicy,
  DataFlowPolicyConfig,
  TaintFlowKind,
  TaintLabel,
  TaintLedger,
  TaintLedgerSnapshot,
} from './types.js';
