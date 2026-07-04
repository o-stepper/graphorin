/**
 * Progent-style declarative tool-argument policies (D4 / tools-15) and
 * Rule-of-Two capability profiles (D4). Both are **pure, deterministic**
 * decision engines the tool executor consults BEFORE a call runs — the
 * preventive layer that turns the coarse lethal-trifecta trigger and the
 * inert `sandboxPolicy` advisory into an enforced default-deny.
 *
 * Progent policy (`ToolArgumentPolicy`):
 * - forbid-before-allow: a matching `forbid` rule always wins over an
 *   `allow` rule, so narrowing composes safely and a later broad allow
 *   can never re-open a denied call,
 * - default-deny for sensitive tools: when `defaultDenySensitive` is on,
 *   a tool flagged `sensitive` with no matching `allow` is blocked,
 * - argument predicates: rules match on tool name (exact / glob) plus an
 *   optional pure predicate over the validated args.
 *
 * Rule-of-Two (`buildRuleOfTwoPolicy`): a session preset declaring which
 * of the three lethal-trifecta legs {untrusted input, sensitive data,
 * external side effects} an agent may hold. Holding all three is the
 * dangerous configuration; the preset deterministically blocks the third
 * leg by compiling to a Progent policy + capability floor.
 *
 * @packageDocumentation
 */

/** The three legs of the lethal trifecta (Meta "Rule of Two"). */
export type TrifectaLeg = 'untrusted-input' | 'sensitive-data' | 'external-side-effects';

/** Side-effect classes the policy engine reasons about. */
export type PolicySideEffectClass = 'pure' | 'read-only' | 'side-effecting' | 'external-stateful';

/** Facts about a tool call the policy engine decides over. */
export interface ToolCallFacts {
  readonly toolName: string;
  readonly sideEffectClass: PolicySideEffectClass;
  /** `true` when the tool reads/handles sensitive data (e.g. `sensitivity: 'secret'`). */
  readonly sensitive?: boolean;
  /** The validated arguments (post-schema, post-repair). */
  readonly args?: unknown;
}

/** A single Progent rule. `forbid` always beats `allow` (see module doc). */
export interface ToolArgumentRule {
  readonly effect: 'allow' | 'forbid';
  /**
   * Tool-name matcher: an exact name, `'*'` for any, or a trailing-`*`
   * prefix glob (e.g. `'fs_*'`). Matching is case-sensitive.
   */
  readonly tool: string;
  /** Optional pure predicate over the call facts (args, sensitivity). */
  readonly when?: (facts: ToolCallFacts) => boolean;
  /** Human-readable reason surfaced on a `forbid` match. */
  readonly reason?: string;
}

/** A compiled tool-argument policy. */
export interface ToolArgumentPolicy {
  readonly rules: ReadonlyArray<ToolArgumentRule>;
  /**
   * Default-deny a `sensitive` tool with no matching `allow` rule
   * (Progent's posture for high-risk tools). Default `false` — a policy
   * with no rules and this off is a no-op (allows everything).
   */
  readonly defaultDenySensitive?: boolean;
}

/** Decision returned by {@link evaluateToolArgumentPolicy}. */
export type ToolPolicyDecision =
  | { readonly effect: 'allow' }
  | { readonly effect: 'forbid'; readonly reason: string };

function toolMatches(pattern: string, toolName: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return toolName.startsWith(pattern.slice(0, -1));
  return pattern === toolName;
}

/**
 * Evaluate a policy against one tool call. Forbid-before-allow: any
 * matching `forbid` rule wins immediately; otherwise a matching `allow`
 * permits the call; otherwise the `defaultDenySensitive` posture (for
 * sensitive tools) or a plain allow applies. Pure + deterministic.
 *
 * @stable
 */
export function evaluateToolArgumentPolicy(
  policy: ToolArgumentPolicy,
  facts: ToolCallFacts,
): ToolPolicyDecision {
  let matchedAllow = false;
  for (const rule of policy.rules) {
    if (!toolMatches(rule.tool, facts.toolName)) continue;
    if (rule.when !== undefined && !rule.when(facts)) continue;
    if (rule.effect === 'forbid') {
      return {
        effect: 'forbid',
        reason: rule.reason ?? `tool '${facts.toolName}' is forbidden by policy`,
      };
    }
    matchedAllow = true;
  }
  if (matchedAllow) return { effect: 'allow' };
  if (policy.defaultDenySensitive === true && facts.sensitive === true) {
    return {
      effect: 'forbid',
      reason: `sensitive tool '${facts.toolName}' has no explicit allow rule (default-deny)`,
    };
  }
  return { effect: 'allow' };
}

/**
 * Capability profile for the Rule-of-Two preset. Declares which of the
 * three trifecta legs the agent is permitted to hold this session. The
 * dangerous configuration is holding all three; a well-formed profile
 * drops at least one.
 *
 * @stable
 */
export interface RuleOfTwoProfile {
  /** May the agent ingest untrusted input (web / MCP / untrusted skills)? */
  readonly untrustedInput: boolean;
  /** May the agent read sensitive data (secrets / PII)? */
  readonly sensitiveData: boolean;
  /** May the agent take external side effects (write / send / deploy)? */
  readonly externalSideEffects: boolean;
}

/** Result of compiling a Rule-of-Two profile. */
export interface RuleOfTwoCompilation {
  /** The tool-argument policy enforcing the profile at call time. */
  readonly policy: ToolArgumentPolicy;
  /**
   * The capability floor: `'read-only'` when the profile denies external
   * side effects (so the agent runtime's capability gate blocks writer
   * tools too), else `undefined`.
   */
  readonly capability?: 'read-only';
  /** The legs the profile holds — `> 2` is flagged unsafe. */
  readonly heldLegs: ReadonlyArray<TrifectaLeg>;
  /** `true` when the profile holds all three legs (the dangerous case). */
  readonly holdsFullTrifecta: boolean;
}

/**
 * Compile a Rule-of-Two profile into an enforceable policy. When the
 * profile denies external side effects, the compilation yields a
 * `'read-only'` capability floor AND a forbid rule over writer tools;
 * when it denies sensitive data, sensitive tools are default-denied.
 * Holding all three legs is surfaced (`holdsFullTrifecta`) so the caller
 * can refuse or warn — the preset never silently permits the trifecta.
 *
 * @stable
 */
export function buildRuleOfTwoPolicy(profile: RuleOfTwoProfile): RuleOfTwoCompilation {
  const heldLegs: TrifectaLeg[] = [];
  if (profile.untrustedInput) heldLegs.push('untrusted-input');
  if (profile.sensitiveData) heldLegs.push('sensitive-data');
  if (profile.externalSideEffects) heldLegs.push('external-side-effects');

  const rules: ToolArgumentRule[] = [];
  if (!profile.externalSideEffects) {
    rules.push({
      effect: 'forbid',
      tool: '*',
      when: (f) =>
        f.sideEffectClass === 'side-effecting' || f.sideEffectClass === 'external-stateful',
      reason: 'Rule-of-Two profile denies external side effects (writer tools blocked)',
    });
  }

  const compilation: RuleOfTwoCompilation = {
    policy: {
      rules,
      defaultDenySensitive: !profile.sensitiveData,
    },
    ...(profile.externalSideEffects ? {} : { capability: 'read-only' as const }),
    heldLegs,
    holdsFullTrifecta: heldLegs.length === 3,
  };
  return compilation;
}
