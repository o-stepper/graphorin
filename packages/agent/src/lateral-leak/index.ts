/**
 * Lateral-leak defense layer aggregate exports.
 *
 * The three primitives compose orthogonally with the four other
 * security boundaries (sub-agent secrets isolation, handoff input
 * filter, outbound redaction, inbound sanitization).
 *
 * @packageDocumentation
 */

export {
  CausalityMonitor,
  type CausalityMonitorCheck,
  type CausalityMonitorConfig,
  type CausalityMonitorStrictness,
  DEFAULT_DENIAL_PATTERNS,
  DEFAULT_MAX_CHAIN_DEPTH,
} from './causality-monitor.js';
export {
  type ChildTrustInput,
  type ContentOriginKind,
  computeSourceTrust,
  evaluateMerge,
  type MergeBiasDecision,
  type MergeGuardConfig,
  type TrustClass,
} from './merge-guard.js';
export {
  type GuardOutcome,
  guardOutboundContent,
  type ProtocolBoundary,
  type ProtocolEscapePolicy,
  type ProtocolGuardConfig,
  resolvePolicy,
} from './protocol-guard.js';
