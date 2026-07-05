/**
 * Rule: `@graphorin/tool-parameter-naming` (RB-49). Inspects the
 * `inputSchema: z.object({...})` declaration of every `tool({...})`
 * invocation and flags two anti-patterns:
 *
 *   - **Ambiguous single-word identifiers** (`user`, `id`, `name`,
 *     `value`, `data`, `input`, `output`, `result`, `to`, `from`,
 *     `key`, `field`). Suggest a self-documenting alternative.
 *   - **Numeric-suffix identifiers** (`arg1`, `arg2`, `param3`).
 *     Suggest a semantic name.
 *
 * Per-tool opt-out: when the tool declares `tags: ['experimental']`
 * or `tags: ['legacy']` the rule is suppressed for that registration.
 * This lets operators defer the rename for a long tail of pre-RB-49
 * tools while the framework migrates without breaking calling code.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';

import {
  AMBIGUOUS_PARAMETER_NAMES,
  discoverToolCallsInSource,
  PARAMETER_NAMING_OPT_OUT_TAGS,
} from '../tool-discovery.js';

const NUMERIC_SUFFIX_PATTERN = /^[A-Za-z]+\d+$/;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Flag ambiguous or numeric-suffix parameter names on `tool({...})` `inputSchema` declarations (RB-49 - write self-documenting parameter names).',
      recommended: true,
    },
    schema: [],
    messages: {
      ambiguous:
        "tool '{{name}}' uses ambiguous parameter name '{{param}}'; prefer a self-documenting name (e.g. '{{param}}Id', '{{param}}Email').",
      numericSuffix:
        "tool '{{name}}' uses numeric-suffix parameter name '{{param}}'; prefer a semantic name (e.g. 'queryText', 'userId').",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      'Program:exit'(): void {
        const filename = context.filename;
        const source = context.sourceCode.text;
        const tools = discoverToolCallsInSource(filename, source);
        for (const tool of tools) {
          if (tool.tags.some((t) => PARAMETER_NAMING_OPT_OUT_TAGS.includes(t))) continue;
          for (const param of tool.parameterNames) {
            if (AMBIGUOUS_PARAMETER_NAMES.includes(param)) {
              context.report({
                loc: { line: tool.line, column: 0 },
                messageId: 'ambiguous',
                data: { name: tool.name, param },
              });
            } else if (NUMERIC_SUFFIX_PATTERN.test(param)) {
              context.report({
                loc: { line: tool.line, column: 0 },
                messageId: 'numericSuffix',
                data: { name: tool.name, param },
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
