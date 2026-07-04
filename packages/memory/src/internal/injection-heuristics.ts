/**
 * Offline heuristics (no provider calls) that flag obvious memory-injection
 * markers in candidate memory text (P1-4). Long-lived memory is the prime
 * target for poisoning: an injected instruction planted today fires weeks
 * later when semantically recalled, defeating session-scoped prompt-injection
 * defenses (MINJA arXiv:2601.05504; MemoryGraft arXiv:2512.16962). Flagged
 * candidates are quarantined at write time so they never enter
 * action-driving recall until a human validates them.
 *
 * The detector is deliberately *high-precision*: every rule targets
 * injection-characteristic structure (imperative override of prior
 * instructions, role-markup smuggling, secrecy/exfiltration directives), not
 * lone common verbs, so benign first-party facts ("I always run in the
 * mornings", "lives in Lisbon") are not quarantined. It is locale-aware via
 * pluggable {@link InjectionRule} lists and performs no network or model
 * calls — pure regex over the candidate string.
 *
 * @packageDocumentation
 */

import { normalizeForMatching } from '@graphorin/security/guardrails';

/**
 * A single named injection-detection rule. The `label` is a stable,
 * audit-friendly identifier surfaced in {@link InjectionScan.markers};
 * the `pattern` MUST NOT carry the `g` flag (stateful `RegExp.test`).
 *
 * @stable
 */
export interface InjectionRule {
  readonly label: string;
  readonly pattern: RegExp;
}

/**
 * Result of scanning a candidate string. `flagged` is `true` when at
 * least one rule matched; `markers` lists the matched rule labels
 * (deduped, in rule order) for the audit trail.
 *
 * @stable
 */
export interface InjectionScan {
  readonly flagged: boolean;
  readonly markers: ReadonlyArray<string>;
}

/**
 * Options for {@link detectMemoryInjection}.
 *
 * @stable
 */
export interface InjectionHeuristicOptions {
  /**
   * Replace the default English rule set wholesale (advanced — for a
   * fully custom locale). When omitted, {@link DEFAULT_INJECTION_RULES}
   * is used.
   */
  readonly rules?: ReadonlyArray<InjectionRule>;
  /**
   * Additional locale-specific rules merged *after* the active rule set.
   * The common way to make the detector locale-aware without discarding
   * the English defaults.
   */
  readonly extraRules?: ReadonlyArray<InjectionRule>;
}

/**
 * Default English injection-marker rules. High-precision: each requires
 * injection-characteristic structure so benign facts do not trip them.
 *
 * @stable
 */
export const DEFAULT_INJECTION_RULES: ReadonlyArray<InjectionRule> = Object.freeze([
  {
    label: 'ignore-previous-instructions',
    pattern:
      /\bignore\s+(?:all\s+|any\s+)?(?:previous|prior|earlier|the\s+above|preceding)\s+(?:instructions?|prompts?|messages?|commands?|directions?|context|rules?)\b/i,
  },
  {
    label: 'disregard-instructions',
    pattern:
      /\bdisregard\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|earlier|above|preceding|prior\s+)?(?:instructions?|prompts?|rules?|guidelines?|guardrails?)\b/i,
  },
  {
    label: 'override-directive',
    pattern: /\boverride\s+(?:the\s+)?(?:system|safety|security|previous|prior|default)\b/i,
  },
  {
    label: 'system-prompt-exfil',
    pattern:
      /\b(?:reveal|show|print|repeat|leak|expose|dump)\b[^.?!\n]{0,40}\b(?:system\s+prompt|system\s+message|initial\s+instructions|hidden\s+(?:instructions|prompt))\b/i,
  },
  {
    label: 'role-markup-injection',
    pattern: /<\/?(?:system|im_start|im_end|tool_call|function_call)\b|\[\/?(?:INST|SYS)\]/i,
  },
  {
    label: 'secrecy-directive',
    pattern:
      /\b(?:do\s+not|don['’]?t|never)\s+(?:tell|inform|notify|alert|mention\s+(?:this\s+)?to|reveal\s+(?:this\s+)?to)\s+(?:the\s+)?(?:user|human|operator|owner)\b|\bwithout\s+(?:telling|informing|notifying|alerting)\s+(?:the\s+)?(?:user|human|operator)\b/i,
  },
  {
    label: 'exfiltration-directive',
    pattern:
      /\b(?:send|forward|email|transmit|upload|post|exfiltrate|leak)\b[^.?!\n]{0,60}\b(?:password|secret|api[\s_-]?keys?|credentials?|private\s+keys?|access\s+tokens?|auth\s+tokens?)\b/i,
  },
  {
    label: 'persistent-override',
    pattern:
      /\bfrom\s+now\s+on\b[^.?!\n]{0,40}\b(?:always|never|you\s+must|ignore|disregard|do\s+not)\b/i,
  },
]);

/**
 * Scan candidate memory text for obvious injection markers. Pure,
 * offline, allocation-light. Returns the matched rule labels so callers
 * can record *why* a candidate was quarantined.
 *
 * @stable
 */
export function detectMemoryInjection(
  text: string,
  options: InjectionHeuristicOptions = {},
): InjectionScan {
  const rules = options.rules ?? DEFAULT_INJECTION_RULES;
  // C6: also scan the NFKC/zero-width-stripped fold so cheap
  // character-injection (zero-width splits, fullwidth homoglyphs) does
  // not slip a poisoned memory past the quarantine gate.
  const normalized = normalizeForMatching(text);
  const scanBoth = (pattern: RegExp): boolean =>
    pattern.test(text) || (normalized !== text && pattern.test(normalized));
  const markers: string[] = [];
  for (const rule of rules) {
    if (scanBoth(rule.pattern)) markers.push(rule.label);
  }
  if (options.extraRules !== undefined) {
    for (const rule of options.extraRules) {
      if (!markers.includes(rule.label) && scanBoth(rule.pattern)) markers.push(rule.label);
    }
  }
  return { flagged: markers.length > 0, markers: Object.freeze(markers) };
}
