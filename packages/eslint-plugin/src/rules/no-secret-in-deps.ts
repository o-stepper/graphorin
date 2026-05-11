/**
 * Rule: `@graphorin/no-secret-in-deps` (RB-24 / DEC-137). Flags any
 * call shaped like `Agent.toTool({ inheritSecrets: [...] })` (or
 * `agent.toTool({...})`) where the `inheritSecrets` array is non-empty
 * and the surrounding object literal does not include a comment whose
 * text starts with `'rb-24-justification:'` (case-insensitive).
 *
 * The rule enforces the principle-of-least-authority discipline from
 * DEC-137: sub-agents inheriting secret allowlists from their parent
 * is opt-in, and the opt-in MUST be explained in code so security
 * reviewers can audit the inheritance graph without guessing.
 *
 * The rule is intentionally syntactic — it operates on the literal
 * call site without trying to resolve the value of the array. This
 * keeps the rule cheap and avoids false negatives from spread /
 * function-call expressions that hide the inheritance shape.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type {
  ArrayExpression,
  CallExpression,
  MemberExpression,
  ObjectExpression,
  Property,
} from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const JUSTIFICATION_TAG = /\brb-24-justification\s*:/i;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require an `// rb-24-justification:` comment when `Agent.toTool({ inheritSecrets: [...] })` carries a non-empty allowlist (DEC-137).',
      recommended: true,
    },
    schema: [],
    messages: {
      missingJustification:
        '`inheritSecrets` is non-empty but the call site lacks an `// rb-24-justification: <reason>` comment. Document why this sub-agent inherits parent secrets per DEC-137.',
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression): void {
        if (!isToToolCall(node)) return;
        const arg = node.arguments[0];
        if (arg === undefined || arg.type !== 'ObjectExpression') return;
        const objectArg = arg as ObjectExpression;
        const inheritSecrets = findInheritSecretsProperty(objectArg);
        if (inheritSecrets === null) return;
        if (!isNonEmptyArray(inheritSecrets)) return;
        if (hasJustificationComment(context, node)) return;
        context.report({
          node: inheritSecrets,
          messageId: 'missingJustification',
        });
      },
    };
  },
};

function isToToolCall(node: CallExpression): boolean {
  if (node.callee.type !== 'MemberExpression') return false;
  const callee = node.callee as MemberExpression;
  if (callee.computed) return false;
  if (callee.property.type !== 'Identifier') return false;
  return callee.property.name === 'toTool';
}

function findInheritSecretsProperty(obj: ObjectExpression): Property['value'] | null {
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const property = prop as Property;
    const key = property.key;
    if (property.computed) continue;
    if (key.type === 'Identifier' && key.name === 'inheritSecrets') return property.value;
    if (key.type === 'Literal' && key.value === 'inheritSecrets') return property.value;
  }
  return null;
}

function isNonEmptyArray(value: Property['value']): boolean {
  if (value.type !== 'ArrayExpression') return false;
  const arr = value as ArrayExpression;
  return arr.elements.some((e) => e !== null);
}

function hasJustificationComment(context: Rule.RuleContext, node: CallExpression): boolean {
  return nodeHasNearbyComment(context, node, JUSTIFICATION_TAG, 1);
}

export default rule;
