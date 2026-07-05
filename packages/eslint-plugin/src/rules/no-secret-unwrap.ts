/**
 * Rule: `@graphorin/no-secret-unwrap` (DEC-020 / ADR-026 / Phase 16).
 *
 * Flags member expressions that look like an unprotected unwrap of a
 * `SecretValue` instance - `<expr>.unwrap()` and `<expr>.reveal()` -
 * outside an allow-listed context. The framework convention is:
 *
 *   - Prefer `value.use(fn)` / `value.useBuffer(fn)` for scoped reads;
 *     they limit the lifetime of the derived V8 string to a single
 *     callback invocation.
 *   - Use `value.reveal()` only as a one-shot escape hatch with an
 *     adjacent justification. The audit log records the call.
 *   - Never use `value.unwrap()` - it is `@deprecated` and is an alias
 *     for `.reveal()` retained only for the v0.x compatibility window.
 *     The rule reports `unwrap()` as `'error'` even when an
 *     opt-out comment is present so the deprecation cliff stays sharp.
 *
 * Per-call opt-out: `// graphorin-allow-secret-unwrap: <reason>` on
 * the line above the call site or anywhere inside the enclosing
 * expression-statement source span. The opt-out is honoured for
 * `reveal()` but **not** for `unwrap()` (the deprecation supersedes
 * any local justification).
 *
 * The rule is intentionally lexical - it matches `.unwrap()` /
 * `.reveal()` on any `MemberExpression` regardless of the receiver
 * type. False positives are tolerated because (a) the receiver is
 * almost always a `SecretValue` in this codebase and (b) the
 * one-line opt-out is cheap.
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type { CallExpression, Identifier, MemberExpression } from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const ALLOW_TAG = /graphorin-allow-secret-unwrap/;

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow `.unwrap()` / `.reveal()` calls on `SecretValue` instances. Prefer `.use(fn)` (scoped) or attach a `// graphorin-allow-secret-unwrap: <reason>` opt-out comment for `.reveal()`.',
      recommended: true,
    },
    schema: [],
    messages: {
      avoidReveal:
        '`.reveal()` returns the unwrapped secret as a V8 string. Prefer `.use(fn)` so the value is scoped to a single callback. Add `// graphorin-allow-secret-unwrap: <reason>` to opt out.',
      avoidUnwrap:
        '`.unwrap()` is deprecated - call `.reveal()` (audited) or `.use(fn)` (scoped). The opt-out comment is intentionally NOT honoured for `.unwrap()` so the deprecation stays sharp.',
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression): void {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression') return;
        const me = callee as MemberExpression;
        if (me.computed) return;
        if (me.property.type !== 'Identifier') return;
        const propName = (me.property as Identifier).name;
        if (propName === 'unwrap') {
          context.report({
            node,
            messageId: 'avoidUnwrap',
          });
          return;
        }
        if (propName === 'reveal') {
          if (hasAllowComment(context, node)) return;
          context.report({
            node,
            messageId: 'avoidReveal',
          });
        }
      },
    };
  },
};

function hasAllowComment(context: Rule.RuleContext, node: CallExpression): boolean {
  return nodeHasNearbyComment(context, node, ALLOW_TAG, 1);
}

export default rule;
