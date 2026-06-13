/**
 * @graphorin/eslint-plugin — ESLint plugin for projects that build on
 * the Graphorin framework.
 *
 * Phase 16 final ruleset:
 *
 *   - `no-secret-unwrap`                  — DEC-020 / ADR-026. Active.
 *   - `no-secret-in-deps`                 — DEC-137. Active.
 *   - `provider-middleware-order`         — DEC-145 / ADR-039. Active.
 *   - `no-implicit-network-call`          — DEC-154 / ADR-041. Active.
 *   - `no-third-party-workflow-aliases`   — DEC-019 / ADR-029. Active.
 *   - `no-bare-tool-exec`                 — principle 3 / DEC-143. Active.
 *   - `tool-description-required`         — Active.
 *   - `tool-examples-recommended`         — Active.
 *   - `tool-parameter-naming`             — Active.
 *
 * (The former `no-console-in-public-api` scaffold — a permanent no-op
 * since Phase 01 — was removed in the v0.4 hygiene pass (PS-21) rather
 * than shipped inert.)
 *
 * @packageDocumentation
 */

import noBareToolExec from './rules/no-bare-tool-exec.js';
import noImplicitNetworkCall from './rules/no-implicit-network-call.js';
import noSecretInDeps from './rules/no-secret-in-deps.js';
import noSecretUnwrap from './rules/no-secret-unwrap.js';
import noThirdPartyWorkflowAliases from './rules/no-third-party-workflow-aliases.js';
import providerMiddlewareOrder from './rules/provider-middleware-order.js';
import toolDescriptionRequired from './rules/tool-description-required.js';
import toolExamplesRecommended from './rules/tool-examples-recommended.js';
import toolParameterNaming from './rules/tool-parameter-naming.js';

export const VERSION = '0.4.0';

export const meta = {
  name: '@graphorin/eslint-plugin',
  version: VERSION,
} as const;

export const rules = {
  'no-bare-tool-exec': noBareToolExec,
  'no-implicit-network-call': noImplicitNetworkCall,
  'no-secret-in-deps': noSecretInDeps,
  'no-secret-unwrap': noSecretUnwrap,
  'no-third-party-workflow-aliases': noThirdPartyWorkflowAliases,
  'provider-middleware-order': providerMiddlewareOrder,
  'tool-description-required': toolDescriptionRequired,
  'tool-examples-recommended': toolExamplesRecommended,
  'tool-parameter-naming': toolParameterNaming,
} as const;

/** Shared severity map for both the legacy and flat recommended presets. */
const RECOMMENDED_RULES = {
  '@graphorin/no-bare-tool-exec': 'warn',
  '@graphorin/no-implicit-network-call': 'error',
  '@graphorin/no-secret-in-deps': 'error',
  '@graphorin/no-secret-unwrap': 'error',
  '@graphorin/no-third-party-workflow-aliases': 'error',
  '@graphorin/provider-middleware-order': 'error',
  '@graphorin/tool-description-required': 'error',
  '@graphorin/tool-examples-recommended': 'warn',
  '@graphorin/tool-parameter-naming': 'warn',
} as const;

/**
 * PS-17: ship BOTH config shapes. `recommended` is the legacy `.eslintrc` form
 * (`plugins: ['@graphorin']`); `flat/recommended` is the ESLint 9+ flat-config
 * form that maps the namespace to the plugin object, so flat-config consumers
 * can `...plugin.configs['flat/recommended']` instead of hand-wiring ten rules.
 */
const plugin: {
  readonly meta: typeof meta;
  readonly rules: typeof rules;
  readonly configs: {
    readonly recommended: {
      readonly plugins: readonly string[];
      readonly rules: typeof RECOMMENDED_RULES;
    };
    readonly 'flat/recommended': {
      plugins: Record<string, unknown>;
      readonly rules: typeof RECOMMENDED_RULES;
    };
  };
} = {
  meta,
  rules,
  configs: {
    recommended: { plugins: ['@graphorin'], rules: RECOMMENDED_RULES },
    // `plugins` is filled in below — the flat form maps the namespace to the
    // plugin object itself, which must exist first.
    'flat/recommended': { plugins: {}, rules: RECOMMENDED_RULES },
  },
};
plugin.configs['flat/recommended'].plugins = { '@graphorin': plugin };

export const configs = plugin.configs;

export {
  AMBIGUOUS_PARAMETER_NAMES,
  type DiscoveredTool,
  discoverToolCallsInSource,
  gradeTool,
  type LintFinding,
  type LintFindingKind,
  PARAMETER_NAMING_OPT_OUT_TAGS,
  PLACEHOLDER_DESCRIPTIONS,
  runToolRules,
  type ToolGraderScore,
} from './tool-discovery.js';

export default plugin;
