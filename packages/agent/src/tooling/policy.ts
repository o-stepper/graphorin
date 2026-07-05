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

import {
  buildRuleOfTwoPolicy,
  evaluateToolArgumentPolicy,
  type PolicySideEffectClass,
  type RuleOfTwoProfile,
  type ToolArgumentPolicy,
} from '@graphorin/security/policy';
import type { ToolArgumentPolicyGuard } from '@graphorin/tools/executor';

export type { RuleOfTwoProfile, ToolArgumentPolicy } from '@graphorin/security/policy';

/**
 * Compile the agent's opt-in tool-argument policy + Rule-of-Two profile
 * into a single guard. `ruleOfTwo` is compiled first (yielding a base
 * policy + optional read-only floor); an explicit `toolPolicy` is
 * appended so its rules compose - a forbid in either always wins
 * (forbid-before-allow). Returns `{ guard: undefined }` when neither is
 * configured (zero overhead on the default path).
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

  const guard: ToolArgumentPolicyGuard = {
    evaluate: (input) =>
      evaluateToolArgumentPolicy(merged, {
        toolName: input.toolName,
        sideEffectClass: input.sideEffectClass as PolicySideEffectClass,
        sensitive: input.sensitive,
        args: input.args,
      }),
  };

  return compiled?.capability !== undefined
    ? { guard, capabilityFloor: compiled.capability }
    : { guard };
}
