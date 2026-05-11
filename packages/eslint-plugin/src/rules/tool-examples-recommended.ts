/**
 * Rule: `@graphorin/tool-examples-recommended` (RB-49). Flags
 * `tool({...})` invocations whose `examples` field is missing,
 * empty, or longer than the documented upper bound (5).
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';

import { discoverToolCallsInSource } from '../tool-discovery.js';

const MAX_EXAMPLES = 5;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Recommend 1-5 `examples` entries on every `tool({...})` registration (Anthropic 2026 'Writing effective tools' guidance).",
      recommended: true,
    },
    schema: [],
    messages: {
      missing:
        "tool '{{name}}' has no examples; add 1-5 worked examples per Anthropic 2026 guidance.",
      tooMany:
        "tool '{{name}}' declares {{count}} examples; the documented upper bound is {{max}}.",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      'Program:exit'(): void {
        const filename = context.filename;
        const source = context.sourceCode.text;
        const tools = discoverToolCallsInSource(filename, source);
        for (const tool of tools) {
          if (!tool.hasExamples || tool.examplesCount === 0) {
            context.report({
              loc: { line: tool.line, column: 0 },
              messageId: 'missing',
              data: { name: tool.name },
            });
          } else if (tool.examplesCount > MAX_EXAMPLES) {
            context.report({
              loc: { line: tool.line, column: 0 },
              messageId: 'tooMany',
              data: {
                name: tool.name,
                count: String(tool.examplesCount),
                max: String(MAX_EXAMPLES),
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
