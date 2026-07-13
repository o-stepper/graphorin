/**
 * Agent-side adapter for the D4 tool-argument policy (Progent) and the
 * Rule-of-Two capability preset. Compiles `AgentConfig.toolPolicy` /
 * `AgentConfig.ruleOfTwo` into the structural
 * {@link ToolArgumentPolicyGuard} the tool executor consumes plus a
 * capability floor the run loop folds into its single-writer gate.
 *
 * The pure decision engine lives in `@graphorin/security/policy`; this
 * module is the thin binding, mirroring `tooling/dataflow.ts`.
 *
 * @packageDocumentation
 */

import { isUntrustedTrustClass } from '@graphorin/security/dataflow';
import {
  buildRuleOfTwoPolicy,
  evaluatePermissionDecision,
  evaluateToolArgumentPolicy,
  isToolDeniedByName,
  type PolicySideEffectClass,
  type RuleOfTwoProfile,
  type ToolArgumentPolicy,
  type ToolCallFacts,
} from '@graphorin/security/policy';
import type { ToolArgumentPolicyFacts, ToolArgumentPolicyGuard } from '@graphorin/tools/executor';

export type { RuleOfTwoProfile, ToolArgumentPolicy } from '@graphorin/security/policy';

/**
 * Compile the agent's opt-in tool-argument policy + Rule-of-Two profile
 * into a single guard. `ruleOfTwo` is compiled first (yielding a base
 * policy + optional read-only floor); an explicit `toolPolicy` is
 * appended so its rules compose - a deny in either always wins
 * (`deny > defer > ask > allow`, E1). The guard carries all three
 * evaluation shapes: the legacy binary `evaluate`, the four-value
 * `decide`, and the advertise-time `deniesName`. Returns
 * `{ guard: undefined }` when neither is configured (zero overhead on
 * the default path).
 */
export function buildToolArgumentPolicy(
  toolPolicy: ToolArgumentPolicy | undefined,
  ruleOfTwo: RuleOfTwoProfile | undefined,
): { readonly guard: ToolArgumentPolicyGuard | undefined; readonly capabilityFloor?: 'read-only' } {
  if (toolPolicy === undefined && ruleOfTwo === undefined) {
    return { guard: undefined };
  }

  const compiled = ruleOfTwo !== undefined ? buildRuleOfTwoPolicy(ruleOfTwo) : undefined;
  const merged: ToolArgumentPolicy = {
    rules: [...(compiled?.policy.rules ?? []), ...(toolPolicy?.rules ?? [])],
    defaultDenySensitive:
      (compiled?.policy.defaultDenySensitive ?? false) ||
      (toolPolicy?.defaultDenySensitive ?? false),
  };

  // W-101: `untrustedSource` derived with the same taxonomy the taint
  // engine uses, so the Rule-of-Two untrustedInput leg and dataflow
  // policy can never disagree about what "untrusted source" means.
  const toFacts = (input: ToolArgumentPolicyFacts): ToolCallFacts => ({
    toolName: input.toolName,
    sideEffectClass: input.sideEffectClass as PolicySideEffectClass,
    sensitive: input.sensitive,
    untrustedSource: isUntrustedTrustClass(input.trustClass),
    args: input.args,
  });

  const guard: ToolArgumentPolicyGuard = {
    evaluate: (input) => evaluateToolArgumentPolicy(merged, toFacts(input)),
    decide: (input) => evaluatePermissionDecision(merged, toFacts(input)),
    deniesName: (toolName) => isToolDeniedByName(merged, toolName),
  };

  return compiled?.capability !== undefined
    ? { guard, capabilityFloor: compiled.capability }
    : { guard };
}
