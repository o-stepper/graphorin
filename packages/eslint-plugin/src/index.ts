/**
 * @graphorin/eslint-plugin — ESLint plugin for projects that build on
 * the Graphorin framework.
 *
 * Phase 16 final ruleset:
 *
 *   - `no-console-in-public-api`         — scaffold (no-op).
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
 * `no-console-in-public-api` is intentionally a no-op for v0.1 — the
 * full implementation is a stylistic refinement that depends on the
 * post-v0.1 public-API surface freeze and does not affect the
 * security guarantees this plugin enforces.
 *
 * @packageDocumentation
 */

import noBareToolExec from './rules/no-bare-tool-exec.js';
import noConsoleInPublicApi from './rules/no-console-in-public-api.js';
import noImplicitNetworkCall from './rules/no-implicit-network-call.js';
import noSecretInDeps from './rules/no-secret-in-deps.js';
import noSecretUnwrap from './rules/no-secret-unwrap.js';
import noThirdPartyWorkflowAliases from './rules/no-third-party-workflow-aliases.js';
import providerMiddlewareOrder from './rules/provider-middleware-order.js';
import toolDescriptionRequired from './rules/tool-description-required.js';
import toolExamplesRecommended from './rules/tool-examples-recommended.js';
import toolParameterNaming from './rules/tool-parameter-naming.js';

export const VERSION = '0.2.0';

export const meta = {
  name: '@graphorin/eslint-plugin',
  version: VERSION,
} as const;

export const rules = {
  'no-bare-tool-exec': noBareToolExec,
  'no-console-in-public-api': noConsoleInPublicApi,
  'no-implicit-network-call': noImplicitNetworkCall,
  'no-secret-in-deps': noSecretInDeps,
  'no-secret-unwrap': noSecretUnwrap,
  'no-third-party-workflow-aliases': noThirdPartyWorkflowAliases,
  'provider-middleware-order': providerMiddlewareOrder,
  'tool-description-required': toolDescriptionRequired,
  'tool-examples-recommended': toolExamplesRecommended,
  'tool-parameter-naming': toolParameterNaming,
} as const;

export const configs = {
  recommended: {
    plugins: ['@graphorin'],
    rules: {
      '@graphorin/no-bare-tool-exec': 'warn',
      '@graphorin/no-implicit-network-call': 'error',
      '@graphorin/no-secret-in-deps': 'error',
      '@graphorin/no-secret-unwrap': 'error',
      '@graphorin/no-third-party-workflow-aliases': 'error',
      '@graphorin/provider-middleware-order': 'error',
      '@graphorin/tool-description-required': 'error',
      '@graphorin/tool-examples-recommended': 'warn',
      '@graphorin/tool-parameter-naming': 'warn',
    },
  },
} as const;

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

const plugin = { meta, rules, configs };

export default plugin;
