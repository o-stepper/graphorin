/**
 * The data-flow policy engine (P1-3). Pure decision function over a
 * {@link DataFlowEvaluation}.
 *
 * @packageDocumentation
 */

import type {
  DataFlowDecision,
  DataFlowEvaluation,
  DataFlowFinding,
  DataFlowPolicy,
  DataFlowPolicyConfig,
} from './types.js';

/** Is this side-effect class a sink (can it exfiltrate / mutate state)? */
function isSink(evaluation: DataFlowEvaluation): boolean {
  return (
    evaluation.sideEffectClass === 'side-effecting' ||
    evaluation.sideEffectClass === 'external-stateful'
  );
}

/** Compose the finding for a tripped flow (metadata only — never bytes). */
function findingFor(
  flow: DataFlowFinding['flow'],
  evaluation: DataFlowEvaluation,
): DataFlowFinding {
  const kinds = evaluation.sourceKinds.length > 0 ? evaluation.sourceKinds.join(', ') : 'untrusted';
  const reason =
    flow === 'untrusted-to-sink'
      ? `untrusted content (${kinds}) flows verbatim into ${evaluation.sideEffectClass} sink '${evaluation.toolName}'`
      : `${evaluation.sideEffectClass} sink '${evaluation.toolName}' fires with untrusted content (${kinds}) and secret-tier data both present in the run (lethal trifecta)`;
  return { flow, reason, sourceKinds: evaluation.sourceKinds };
}

/**
 * Build a {@link DataFlowPolicy} from config.
 *
 * Decision procedure for a sink call:
 * 1. `mode === 'off'` or the tool is not a sink → `allow`.
 * 2. Arguments carry untrusted content verbatim → `untrusted-to-sink`.
 * 3. Else, if `guardTrifecta` (default on) and both untrusted **and**
 *    secret-tier content have entered the run → `lethal-trifecta`.
 * 4. No tainted flow → `allow`.
 * 5. A tainted flow into a `declassifySinks` sink → `declassify` (audited,
 *    allowed). Otherwise `'shadow'` → `flag` (audited, allowed),
 *    `'enforce'` → `block`.
 *
 * @stable
 */
export function createDataFlowPolicy(config: DataFlowPolicyConfig): DataFlowPolicy {
  const mode = config.mode;
  const guardTrifecta = config.guardTrifecta ?? true;
  const declassifySinks = new Set(config.declassifySinks ?? []);

  return {
    mode,
    evaluate(evaluation: DataFlowEvaluation): DataFlowDecision {
      if (mode === 'off' || !isSink(evaluation)) return { action: 'allow' };

      let finding: DataFlowFinding | undefined;
      if (evaluation.carriesUntrustedVerbatim) {
        finding = findingFor('untrusted-to-sink', evaluation);
      } else if (guardTrifecta && evaluation.untrustedSeen && evaluation.sensitiveSeen) {
        finding = findingFor('lethal-trifecta', evaluation);
      }
      if (finding === undefined) return { action: 'allow' };

      if (declassifySinks.has(evaluation.toolName)) {
        return { action: 'declassify', ...finding };
      }
      return mode === 'shadow' ? { action: 'flag', ...finding } : { action: 'block', ...finding };
    },
  };
}
