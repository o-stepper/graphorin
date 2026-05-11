/**
 * Rule: `@graphorin/tool-description-required` (RB-49 / suggested
 * DEC-165). Flags `tool({...})` invocations whose `description`
 * field is missing, too short (< 20 characters), or a placeholder
 * value (`'TODO'` / `'FIXME'` / `'tbd'` / `'description'` /
 * `'placeholder'`, case-insensitive).
 *
 * The rule shares its discovery + scoring code with the
 * `graphorin tools lint` CLI subcommand (Phase 15) so the rule
 * logic has a single source of truth.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';

import { discoverToolCallsInSource, PLACEHOLDER_DESCRIPTIONS } from '../tool-discovery.js';

const MIN_DESCRIPTION_LENGTH = 20;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a meaningful `description` on every `tool({...})` registration. RB-49 (Anthropic 2026 advanced tool use guidance).',
      recommended: true,
    },
    schema: [],
    messages: {
      missing:
        "tool '{{name}}' has no description; add a description that explains what the tool does and when to use it.",
      tooShort:
        "tool '{{name}}' description is shorter than {{min}} characters (currently {{len}}).",
      placeholder: "tool '{{name}}' description is a placeholder ('{{value}}').",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      'Program:exit'(): void {
        const filename = context.filename;
        const source = context.sourceCode.text;
        const tools = discoverToolCallsInSource(filename, source);
        for (const tool of tools) {
          const desc = tool.description?.trim();
          if (desc === undefined || desc.length === 0) {
            context.report({
              loc: { line: tool.line, column: 0 },
              messageId: 'missing',
              data: { name: tool.name },
            });
          } else if (desc.length < MIN_DESCRIPTION_LENGTH) {
            context.report({
              loc: { line: tool.line, column: 0 },
              messageId: 'tooShort',
              data: {
                name: tool.name,
                min: String(MIN_DESCRIPTION_LENGTH),
                len: String(desc.length),
              },
            });
          } else if (PLACEHOLDER_DESCRIPTIONS.includes(desc.toLowerCase())) {
            context.report({
              loc: { line: tool.line, column: 0 },
              messageId: 'placeholder',
              data: { name: tool.name, value: desc },
            });
          }
        }
      },
    };
  },
};

export default rule;
