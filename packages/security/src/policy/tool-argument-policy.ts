/**
 * Progent-style declarative tool-argument policies (D4 / tools-15) and
 * Rule-of-Two capability profiles (D4). Both are **pure, deterministic**
 * decision engines the tool executor consults BEFORE a call runs - the
 * preventive layer that turns the coarse lethal-trifecta trigger and the
 * inert `sandboxPolicy` advisory into an enforced default-deny.
 *
 * Progent policy (`ToolArgumentPolicy`):
 * - four-value vocabulary (E1): rule effects are `allow | deny | ask |
 *   defer` with priority `deny > defer > ask > allow` (`'forbid'` stays
 *   accepted as the pre-E1 alias of `'deny'`), so narrowing composes
 *   safely and a later broad allow can never re-open a denied call,
 * - default-deny for sensitive tools: when `defaultDenySensitive` is on,
 *   a tool flagged `sensitive` with no matching `allow` is blocked,
 * - argument predicates: rules match on tool name (exact / glob) plus an
 *   optional pure predicate over the validated args; predicate-free
 *   `deny` rules additionally power the advertise-time deny-by-name
 *   check ({@link isToolDeniedByName}).
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
  /**
   * `true` when the tool is an untrusted-content SOURCE (W-101) - its
   * trust class is one the taint engine treats as injection-bearing
   * (mcp-derived / web-search / skill-untrusted; see
   * `isUntrustedTrustClass` in `@graphorin/security/dataflow`). Powers
   * the Rule-of-Two `untrustedInput` leg. The engine stays pure: the
   * caller derives this from the tool's metadata.
   */
  readonly untrustedSource?: boolean;
  /** The validated arguments (post-schema, post-repair). */
  readonly args?: unknown;
}

/**
 * Four-value permission vocabulary (E1 / item 11):
 *
 * - `'allow'` - the call may run.
 * - `'deny'`  - the call must not run (deterministic block).
 * - `'ask'`   - the call needs a human decision BEFORE it runs; only a
 *   surface that can durably suspend (the agent pre-screen) can honour
 *   it - a bare executor fails it closed.
 * - `'defer'` - the decision is parked for ASYNCHRONOUS resolution
 *   (messenger button, workflow awakeable) with a timeout that
 *   auto-denies; like `'ask'`, honoured only by a suspending surface.
 *
 * Priority when several rules match: `deny > defer > ask > allow`.
 *
 * @stable
 */
export type PermissionEffect = 'allow' | 'deny' | 'ask' | 'defer';

/**
 * Effect accepted on a {@link ToolArgumentRule}: the four-value
 * vocabulary plus `'forbid'`, the pre-E1 spelling kept as a back-compat
 * alias of `'deny'` (existing policies keep working byte-for-byte).
 *
 * @stable
 */
export type ToolRuleEffect = PermissionEffect | 'forbid';

/** A single Progent rule. `deny`/`forbid` always beats `allow` (see module doc). */
export interface ToolArgumentRule {
  readonly effect: ToolRuleEffect;
  /**
   * Tool-name matcher: an exact name, `'*'` for any, or a trailing-`*`
   * prefix glob (e.g. `'fs_*'`). Matching is case-sensitive.
   */
  readonly tool: string;
  /** Optional pure predicate over the call facts (args, sensitivity). */
  readonly when?: (facts: ToolCallFacts) => boolean;
  /** Human-readable reason surfaced on a non-`allow` match. */
  readonly reason?: string;
}

/** A compiled tool-argument policy. */
export interface ToolArgumentPolicy {
  readonly rules: ReadonlyArray<ToolArgumentRule>;
  /**
   * Default-deny a `sensitive` tool with no matching `allow` rule
   * (Progent's posture for high-risk tools). Default `false` - a policy
   * with no rules and this off is a no-op (allows everything).
   */
  readonly defaultDenySensitive?: boolean;
}

/** Decision returned by {@link evaluateToolArgumentPolicy}. */
export type ToolPolicyDecision =
  | { readonly effect: 'allow' }
  | { readonly effect: 'forbid'; readonly reason: string };

/**
 * Four-value decision returned by {@link evaluatePermissionDecision}
 * (E1). Non-`allow` effects always carry a reason.
 *
 * @stable
 */
export type PermissionDecision =
  | { readonly effect: 'allow' }
  | { readonly effect: 'deny' | 'ask' | 'defer'; readonly reason: string };

function toolMatches(pattern: string, toolName: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return toolName.startsWith(pattern.slice(0, -1));
  return pattern === toolName;
}

/** `'forbid'` is the pre-E1 spelling of `'deny'` - normalise once here. */
function normalisedEffect(effect: ToolRuleEffect): PermissionEffect {
  return effect === 'forbid' ? 'deny' : effect;
}

const EFFECT_PRIORITY: Readonly<Record<PermissionEffect, number>> = {
  deny: 3,
  defer: 2,
  ask: 1,
  allow: 0,
};

/**
 * Evaluate a policy against one tool call under the four-value
 * vocabulary (E1). Every matching rule contributes its (normalised)
 * effect; the strongest wins with priority `deny > defer > ask >
 * allow`, so a broad late `allow` can never re-open a denied call and
 * an `ask`/`defer` narrows an `allow` but yields to a `deny`. When no
 * rule matches, `defaultDenySensitive` denies sensitive tools; anything
 * else is allowed. Pure + deterministic.
 *
 * @stable
 */
export function evaluatePermissionDecision(
  policy: ToolArgumentPolicy,
  facts: ToolCallFacts,
): PermissionDecision {
  let strongest: PermissionEffect | undefined;
  let strongestReason: string | undefined;
  for (const rule of policy.rules) {
    if (!toolMatches(rule.tool, facts.toolName)) continue;
    if (rule.when !== undefined && !rule.when(facts)) continue;
    const effect = normalisedEffect(rule.effect);
    if (effect === 'deny') {
      // Nothing outranks deny - short-circuit.
      return {
        effect: 'deny',
        reason: rule.reason ?? `tool '${facts.toolName}' is denied by policy`,
      };
    }
    if (strongest === undefined || EFFECT_PRIORITY[effect] > EFFECT_PRIORITY[strongest]) {
      strongest = effect;
      strongestReason = rule.reason;
    }
  }
  if (strongest === 'defer' || strongest === 'ask') {
    return {
      effect: strongest,
      reason:
        strongestReason ??
        `tool '${facts.toolName}' requires a${strongest === 'ask' ? 'n interactive' : ' deferred'} approval by policy`,
    };
  }
  if (strongest === 'allow') return { effect: 'allow' };
  if (policy.defaultDenySensitive === true && facts.sensitive === true) {
    return {
      effect: 'deny',
      reason: `sensitive tool '${facts.toolName}' has no explicit allow rule (default-deny)`,
    };
  }
  return { effect: 'allow' };
}

/**
 * Evaluate a policy against one tool call, projected onto the binary
 * pre-E1 vocabulary. Delegates to {@link evaluatePermissionDecision}
 * and maps every non-`allow` effect to `'forbid'`: a consumer that
 * cannot ask or defer must not run the call (fail-closed). Policies
 * written before E1 contain only `allow`/`forbid` rules, for which this
 * is byte-identical to the original forbid-before-allow semantics.
 *
 * @stable
 */
export function evaluateToolArgumentPolicy(
  policy: ToolArgumentPolicy,
  facts: ToolCallFacts,
): ToolPolicyDecision {
  const decision = evaluatePermissionDecision(policy, facts);
  if (decision.effect === 'allow') return { effect: 'allow' };
  return { effect: 'forbid', reason: decision.reason };
}

/** Result of {@link isToolDeniedByName}. */
export type NameDenialDecision =
  | { readonly denied: false }
  | { readonly denied: true; readonly reason: string };

/**
 * Name-level deny check (E1 deny-by-name): does a PREDICATE-FREE
 * `deny`/`forbid` rule match this tool name? Used at advertise time -
 * the per-step catalogue, `tool_search` results/promotion and the
 * executor's early mirror all consult it BEFORE any args exist. A rule
 * with a `when` predicate is call-time only (its predicate reasons over
 * validated args) and never participates here, so the check stays
 * deterministic for a given policy + name.
 *
 * @stable
 */
export function isToolDeniedByName(
  policy: ToolArgumentPolicy,
  toolName: string,
): NameDenialDecision {
  for (const rule of policy.rules) {
    if (rule.when !== undefined) continue;
    if (normalisedEffect(rule.effect) !== 'deny') continue;
    if (!toolMatches(rule.tool, toolName)) continue;
    return {
      denied: true,
      reason: rule.reason ?? `tool '${toolName}' is denied by name by policy`,
    };
  }
  return { denied: false };
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
  /** The legs the profile holds - `> 2` is flagged unsafe. */
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
 * can refuse or warn - the preset never silently permits the trifecta.
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
  // W-101: the untrustedInput leg was previously bookkeeping-only
  // (heldLegs / holdsFullTrifecta) with NO enforcement point - a profile
  // giving up this leg still had every web-search/MCP tool callable
  // while both remaining legs were live: exactly the configuration the
  // preset promises to prevent. Denying the leg now forbids calling
  // untrusted-SOURCE tools (deterministic, by trust-class metadata -
  // the same taxonomy the taint engine uses). Untrusted content
  // arriving in user MESSAGES is out of this rule's scope.
  if (!profile.untrustedInput) {
    rules.push({
      effect: 'forbid',
      tool: '*',
      when: (f) => f.untrustedSource === true,
      reason: 'Rule-of-Two profile denies untrusted input (untrusted-source tools blocked)',
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
