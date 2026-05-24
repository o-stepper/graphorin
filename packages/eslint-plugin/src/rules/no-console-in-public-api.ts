/**
 * Rule: no-console-in-public-api
 *
 * Phase 01 scaffold — this is a no-op rule that only proves the plugin loads
 * end-to-end. The real implementation lands in a later phase and will flag
 * any `console.*` call inside a file under `src/` that is part of a package's
 * public export surface.
 */

import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `console.*` calls in code that is part of a Graphorin package public API surface. (Scaffold — no-op in v0.3.0.)',
      recommended: false,
    },
    schema: [],
    messages: {},
  },
  create(): Rule.RuleListener {
    return {};
  },
};

export default rule;
