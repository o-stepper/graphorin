/**
 * Rule: `@graphorin/no-secret-in-deps` (DEC-137). Flags any
 * call shaped like `withChildToolSecretsContext({ secretsAllowed:
 * [...] }, fn)` where the `secretsAllowed` array is non-empty and the
 * surrounding call site does not include a comment whose text starts
 * with `'rb-24-justification:'` (case-insensitive).
 *
 * The rule enforces the principle-of-least-authority discipline from
 * DEC-137: granting a child tool scope access to parent secrets is
 * opt-in, and the opt-in MUST be explained in code so security
 * reviewers can audit the inheritance graph without guessing.
 *
 * History: this rule originally matched `Agent.toTool({
 * inheritSecrets: [...] })`, a pre-0.5 API shape that no longer
 * exists - `AgentToToolOptions` deliberately has no secret-inheritance
 * mechanism at that boundary. The DEC-137 grant point today is the
 * explicit child ACL scope opened via `withChildToolSecretsContext`
 * from `@graphorin/security` (whose `secretsAllowed` is intersected
 * with the parent allowlist), so that is what the rule matches now.
 *
 * The rule is intentionally syntactic - it operates on the literal
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
  Identifier,
  MemberExpression,
  ObjectExpression,
  Property,
} from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const JUSTIFICATION_TAG = /\brb-24-justification\s*:/i;
const GRANT_CALLEE = 'withChildToolSecretsContext';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require an `// rb-24-justification:` comment when `withChildToolSecretsContext({ secretsAllowed: [...] })` grants a non-empty allowlist to a child tool scope (DEC-137).',
      recommended: true,
    },
    schema: [],
    messages: {
      missingJustification:
        '`secretsAllowed` is non-empty but the call site lacks an `// rb-24-justification: <reason>` comment. Document why this child tool scope inherits parent secrets per DEC-137.',
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression): void {
        if (!isGrantCall(node)) return;
        const arg = node.arguments[0];
        if (arg === undefined || arg.type !== 'ObjectExpression') return;
        const objectArg = arg as ObjectExpression;
        const secretsAllowed = findSecretsAllowedProperty(objectArg);
        if (secretsAllowed === null) return;
        if (!isNonEmptyArray(secretsAllowed)) return;
        if (hasJustificationComment(context, node)) return;
        context.report({
          node: secretsAllowed,
          messageId: 'missingJustification',
        });
      },
    };
  },
};

function isGrantCall(node: CallExpression): boolean {
  if (node.callee.type === 'Identifier') {
    return (node.callee as Identifier).name === GRANT_CALLEE;
  }
  if (node.callee.type === 'MemberExpression') {
    const callee = node.callee as MemberExpression;
    if (callee.computed) return false;
    if (callee.property.type !== 'Identifier') return false;
    return callee.property.name === GRANT_CALLEE;
  }
  return false;
}

function findSecretsAllowedProperty(obj: ObjectExpression): Property['value'] | null {
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const property = prop as Property;
    const key = property.key;
    if (property.computed) continue;
    if (key.type === 'Identifier' && key.name === 'secretsAllowed') return property.value;
    if (key.type === 'Literal' && key.value === 'secretsAllowed') return property.value;
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
