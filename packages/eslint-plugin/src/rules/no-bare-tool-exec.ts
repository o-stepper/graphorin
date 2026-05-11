/**
 * Rule: `@graphorin/no-bare-tool-exec`. Flags any `tool({...})`
 * invocation whose `execute` function does not reference
 * `ctx.signal`. The intent is principle 3 (streaming-first) +
 * DEC-143 (cancellation contract): every long-running tool MUST
 * propagate the abort signal to the underlying I/O so cancellation
 * actually frees resources.
 *
 * The check is intentionally lexical — it scans the function body for
 * the literal string `signal` (matching `ctx.signal`,
 * `request.signal`, `args.signal`, etc.). False positives are
 * acceptable because the fix is one comment line; false negatives are
 * not, because they hide cancellation bugs in production.
 *
 * Per-call opt-out: `// graphorin-allow-bare-exec: <reason>` on the
 * line above the `execute` function or anywhere inside the tool
 * builder call.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type {
  ArrowFunctionExpression,
  CallExpression,
  FunctionExpression,
  Identifier,
  ObjectExpression,
  Property,
} from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const ALLOW_TAG = /graphorin-allow-bare-exec/;
const SIGNAL_REFERENCE_RE = /\bsignal\b/;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require every `tool({...})` `execute` function to reference `ctx.signal` so cancellation propagates to the underlying I/O (principle 3, DEC-143).',
      recommended: true,
    },
    schema: [],
    messages: {
      missingSignal:
        "tool '{{name}}' `execute` function does not reference `ctx.signal`; long-running tools MUST propagate the abort signal. Add `// graphorin-allow-bare-exec: <reason>` to opt out.",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression): void {
        if (!isToolBuilderCall(node)) return;
        const arg = node.arguments[0];
        if (arg === undefined || arg.type !== 'ObjectExpression') return;
        const exec = findExecuteProperty(arg as ObjectExpression);
        if (exec === null) return;
        if (!isFunctionLike(exec)) return;
        const fn = exec as ArrowFunctionExpression | FunctionExpression;
        if (!fn.body) return;
        const fnSource = context.sourceCode.getText(fn.body);
        if (SIGNAL_REFERENCE_RE.test(fnSource)) return;
        if (hasAllowComment(context, node)) return;
        const name = extractToolName(arg as ObjectExpression) ?? '<unknown>';
        context.report({
          node: fn,
          messageId: 'missingSignal',
          data: { name },
        });
      },
    };
  },
};

function isToolBuilderCall(node: CallExpression): boolean {
  if (node.callee.type !== 'Identifier') return false;
  return (node.callee as Identifier).name === 'tool';
}

function findExecuteProperty(obj: ObjectExpression): Property['value'] | null {
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const property = prop as Property;
    if (property.computed) continue;
    const key = property.key;
    if (key.type === 'Identifier' && key.name === 'execute') return property.value;
    if (key.type === 'Literal' && key.value === 'execute') return property.value;
  }
  return null;
}

function isFunctionLike(
  value: Property['value'],
): value is ArrowFunctionExpression | FunctionExpression {
  return value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression';
}

function extractToolName(obj: ObjectExpression): string | null {
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const property = prop as Property;
    if (property.computed) continue;
    const key = property.key;
    const isName =
      (key.type === 'Identifier' && key.name === 'name') ||
      (key.type === 'Literal' && key.value === 'name');
    if (!isName) continue;
    if (property.value.type === 'Literal' && typeof property.value.value === 'string') {
      return property.value.value;
    }
  }
  return null;
}

function hasAllowComment(context: Rule.RuleContext, node: CallExpression): boolean {
  return nodeHasNearbyComment(context, node, ALLOW_TAG, 1);
}

export default rule;
