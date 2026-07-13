/**
 * E1 permission pre-screen for the agent run loop: combine the
 * caller's {@link PermissionHook} with the four-value argument-policy
 * verdict BEFORE a call is dispatched, so `ask`/`defer` can ride the
 * agent's durable-HITL suspend (the only surface that can park a run,
 * N-9) instead of failing closed inside the executor.
 *
 * Evaluation mirrors the executor's phase order: the hook runs first
 * (its allowed `updatedInput` rewrite is re-validated and becomes the
 * input every later gate sees, W-118), then the policy `decide` runs
 * over the post-rewrite validated input. The verdicts combine by the
 * vocabulary priority `deny > defer > ask > allow`.
 *
 * @packageDocumentation
 */

import type { ResolvedTool, RunContext, ToolCall } from '@graphorin/core';
import type {
  PermissionHook,
  PermissionHookResult,
  ToolArgumentPolicyGuard,
} from '@graphorin/tools/executor';

/** What the walk needs to run the pre-screen (absent surfaces skip it). */
export interface PermissionPreScreenEnv {
  readonly permissionHook?: PermissionHook | undefined;
  readonly argumentPolicyGuard?: ToolArgumentPolicyGuard | undefined;
}

/** Outcome of {@link preScreenPermission}. */
export type PermissionPreScreenVerdict =
  | {
      readonly kind: 'allow';
      /** Possibly hook-rewritten validated input (feeds `needsApproval`). */
      readonly validatedInput: unknown;
      /** Possibly hook-rewritten raw-shaped args (what an approval would carry). */
      readonly effectiveArgs: unknown;
    }
  | { readonly kind: 'deny'; readonly reason: string }
  | {
      readonly kind: 'ask' | 'defer';
      readonly reason?: string;
      /** Raw-shaped args the parked approval must carry (post-rewrite). */
      readonly effectiveArgs: unknown;
    }
  | { readonly kind: 'invalid'; readonly message: string };

const PRIORITY = { deny: 3, defer: 2, ask: 1, allow: 0 } as const;

/** `true` when either permission surface is configured for this agent. */
export function hasPermissionLayer(env: PermissionPreScreenEnv): boolean {
  return env.permissionHook !== undefined || env.argumentPolicyGuard?.decide !== undefined;
}

/**
 * Run the combined hook + policy pre-screen for one executor-bound
 * call. The caller supplies the SCHEMA-VALIDATED input (calls whose
 * args do not parse skip the pre-screen - the executor's repair path
 * owns them, and its permission phase fails ask/defer closed there).
 */
export async function preScreenPermission(
  env: PermissionPreScreenEnv,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly validatedInput: unknown;
    readonly runContext: RunContext;
  },
): Promise<PermissionPreScreenVerdict> {
  const { call, tool, runContext } = input;
  let validatedInput = input.validatedInput;
  let effectiveArgs: unknown = call.args;

  let hookDecision: PermissionHookResult['decision'] = 'allow';
  let hookReason: string | undefined;
  const hook = env.permissionHook;
  if (hook !== undefined) {
    let verdict: PermissionHookResult;
    try {
      verdict = await Promise.resolve(
        hook({
          call,
          validatedInput,
          toolName: tool.name,
          sideEffectClass: tool.__sideEffectClass,
          trustClass: tool.__trustClass,
          ...(tool.sensitivity !== undefined ? { sensitivity: tool.sensitivity } : {}),
          runContext,
        }),
      );
    } catch (cause) {
      // Fail closed - identical posture to the executor phase.
      return {
        kind: 'deny',
        reason: `permission hook failed (fail-closed): ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      };
    }
    hookDecision = verdict.decision;
    hookReason = verdict.reason;
    if (verdict.decision === 'deny') {
      return { kind: 'deny', reason: verdict.reason ?? 'denied by permission hook' };
    }
    if (verdict.updatedInput !== undefined) {
      // Re-validate the rewrite; the parsed value feeds the policy and
      // `needsApproval`, the raw shape is what an approval carries and
      // what a resume replays (W-118).
      const reparsed = tool.inputSchema.safeParse(verdict.updatedInput);
      if (!reparsed.success) {
        return {
          kind: 'invalid',
          message: `Permission hook rewrite failed schema re-validation: ${reparsed.error.message}`,
        };
      }
      validatedInput = reparsed.data;
      effectiveArgs = verdict.updatedInput;
    }
  }

  let policyDecision: 'allow' | 'deny' | 'ask' | 'defer' = 'allow';
  let policyReason: string | undefined;
  const decide = env.argumentPolicyGuard?.decide;
  if (decide !== undefined) {
    const decision = decide({
      toolName: tool.name,
      sideEffectClass: tool.__sideEffectClass,
      sensitive: tool.sensitivity === 'secret',
      trustClass: tool.__trustClass,
      args: validatedInput,
    });
    policyDecision = decision.effect;
    if (decision.effect !== 'allow') policyReason = decision.reason;
  }

  const combined =
    PRIORITY[hookDecision] >= PRIORITY[policyDecision] ? hookDecision : policyDecision;
  const combinedReason =
    combined === hookDecision && hookReason !== undefined ? hookReason : policyReason;
  if (combined === 'deny') {
    return { kind: 'deny', reason: combinedReason ?? 'denied by permission policy' };
  }
  if (combined === 'ask' || combined === 'defer') {
    return {
      kind: combined,
      ...(combinedReason !== undefined ? { reason: combinedReason } : {}),
      effectiveArgs,
    };
  }
  return { kind: 'allow', validatedInput, effectiveArgs };
}
