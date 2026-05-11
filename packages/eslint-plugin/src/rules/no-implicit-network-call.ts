/**
 * Rule: `@graphorin/no-implicit-network-call` (DEC-154 / ADR-041).
 * Flags any direct `fetch(...)`, `https.request(...)`, `http.request(...)`,
 * `axios(...)` / `axios.<verb>(...)`, or `XMLHttpRequest` invocation in
 * code under a `@graphorin/*` package's `src/` directory unless the
 * call site carries an opt-out comment whose text contains
 * `'graphorin-allow-network'`.
 *
 * Companion to the `pnpm run check-no-network` static analysis script.
 * The lint surface catches the pattern at author time so reviewers do
 * not need to wait for CI to flag a missed network gate.
 *
 * The rule is intentionally limited to the framework's own code paths
 * — consumer applications can call `fetch` freely. The rule activates
 * whenever the linted file path matches `/packages/<pkg>/src/`.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type { CallExpression, Identifier, MemberExpression, NewExpression } from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const ALLOW_TAG = /graphorin-allow-network/;
const FRAMEWORK_PATH_RE = /\bpackages\/[a-z0-9_-]+\/src\b/;

const NETWORK_CALLEES = new Set(['fetch', 'XMLHttpRequest']);
const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'request']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct network primitives (`fetch`, `axios`, `http.request`, `XMLHttpRequest`) in `@graphorin/*` framework code without an explicit opt-out comment (DEC-154).',
      recommended: true,
    },
    schema: [],
    messages: {
      forbidden:
        "direct network call '{{callee}}' in framework code; user actions must initiate network I/O. Add `// graphorin-allow-network: <reason>` to opt out.",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    if (!FRAMEWORK_PATH_RE.test(context.filename.replace(/\\/g, '/'))) {
      return {};
    }
    return {
      CallExpression(node: CallExpression): void {
        const name = describeCallee(node);
        if (name === null) return;
        if (hasAllowComment(context, node)) return;
        context.report({
          node,
          messageId: 'forbidden',
          data: { callee: name },
        });
      },
      NewExpression(node: NewExpression): void {
        if (node.callee.type !== 'Identifier') return;
        const callee = node.callee as Identifier;
        if (callee.name !== 'XMLHttpRequest') return;
        if (hasAllowComment(context, node)) return;
        context.report({
          node,
          messageId: 'forbidden',
          data: { callee: 'new XMLHttpRequest' },
        });
      },
    };
  },
};

function describeCallee(node: CallExpression): string | null {
  if (node.callee.type === 'Identifier') {
    const name = (node.callee as Identifier).name;
    if (NETWORK_CALLEES.has(name) || name === 'axios') return name;
    return null;
  }
  if (node.callee.type === 'MemberExpression') {
    const me = node.callee as MemberExpression;
    if (me.computed) return null;
    const objName = me.object.type === 'Identifier' ? (me.object as Identifier).name : null;
    if (objName === null) return null;
    const propName = me.property.type === 'Identifier' ? (me.property as Identifier).name : null;
    if (propName === null) return null;
    if (
      (objName === 'http' || objName === 'https') &&
      (propName === 'request' || propName === 'get')
    )
      return `${objName}.${propName}`;
    if (objName === 'axios' && HTTP_VERBS.has(propName)) return `axios.${propName}`;
    return null;
  }
  return null;
}

function hasAllowComment(context: Rule.RuleContext, node: CallExpression | NewExpression): boolean {
  return nodeHasNearbyComment(context, node, ALLOW_TAG, 1);
}

export default rule;
