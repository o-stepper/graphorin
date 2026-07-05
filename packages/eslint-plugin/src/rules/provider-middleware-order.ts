/**
 * Rule: `@graphorin/provider-middleware-order` (DEC-145 / ADR-039).
 * Lint-time enforcement of the canonical middleware ordering for
 * `composeProviderMiddleware([...])`. Catches the same class of error
 * the runtime composer raises (`MiddlewareOrderingError`) without
 * requiring the runtime to actually wire the chain.
 *
 * The canonical order, outermost → innermost, mirrors the runtime
 * constant `CANONICAL_MIDDLEWARE_ORDER` exported by
 * `@graphorin/provider/middleware`. Built-ins not in the canonical
 * list are tolerated at any position.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type { ArrayExpression, CallExpression, Identifier, Node } from 'estree';

const CANONICAL_ORDER: ReadonlyArray<string> = [
  'withTracing',
  'withRetry',
  'withRateLimit',
  'withCostLimit',
  'withCostTracking',
  'withFallback',
  'withRedaction',
];

const CANONICAL_INDEX: ReadonlyMap<string, number> = new Map(
  CANONICAL_ORDER.map((name, idx) => [name, idx]),
);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce the canonical provider-middleware ordering at lint time. Mirrors the runtime `MiddlewareOrderingError` from `@graphorin/provider/middleware`.',
      recommended: true,
    },
    schema: [],
    messages: {
      orderingViolation: "'{{outer}}' must appear before '{{inner}}' (canonical order: {{order}}).",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression): void {
        if (!isComposeCall(node)) return;
        const arg = node.arguments[0];
        if (arg === undefined || arg.type !== 'ArrayExpression') return;
        const factories = extractFactoryNames(arg as ArrayExpression);
        const recognised: { name: string; index: number; node: Node }[] = [];
        for (const f of factories) {
          const idx = CANONICAL_INDEX.get(f.name);
          if (idx !== undefined) recognised.push({ name: f.name, index: idx, node: f.node });
        }
        for (let i = 1; i < recognised.length; i++) {
          const prev = recognised[i - 1];
          const cur = recognised[i];
          if (prev !== undefined && cur !== undefined && prev.index > cur.index) {
            context.report({
              node: cur.node,
              messageId: 'orderingViolation',
              data: {
                outer: cur.name,
                inner: prev.name,
                order: CANONICAL_ORDER.join(' → '),
              },
            });
          }
        }
      },
    };
  },
};

function isComposeCall(node: CallExpression): boolean {
  if (node.callee.type === 'Identifier') {
    return (node.callee as Identifier).name === 'composeProviderMiddleware';
  }
  if (node.callee.type === 'MemberExpression') {
    const prop = node.callee.property;
    if (prop.type === 'Identifier' && prop.name === 'composeProviderMiddleware') return true;
  }
  return false;
}

function extractFactoryNames(arr: ArrayExpression): { name: string; node: Node }[] {
  const out: { name: string; node: Node }[] = [];
  for (const elt of arr.elements) {
    if (elt === null) continue;
    // Each element is one of:
    //   - `withTracing()` / `withRetry({...})` - CallExpression with Identifier callee
    //   - `withTracing` (factory ref) - Identifier
    //   - `provider.withTracing()` - CallExpression with MemberExpression callee
    if (elt.type === 'Identifier') {
      out.push({ name: (elt as Identifier).name, node: elt });
      continue;
    }
    if (elt.type === 'CallExpression') {
      const callee = elt.callee;
      if (callee.type === 'Identifier') {
        out.push({ name: (callee as Identifier).name, node: elt });
      } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
        out.push({ name: callee.property.name, node: elt });
      }
    }
  }
  return out;
}

export default rule;
