/**
 * Rule: `@graphorin/no-third-party-workflow-aliases` (DEC-019 /
 * ADR-029). Flags any identifier in `@graphorin/workflow` source whose
 * name matches a known third-party workflow primitive (e.g. the
 * library-specific names that Graphorin deliberately renamed). The
 * intent is legal hygiene: the framework's primitives are
 * `Directive`, `Dispatch`, `pause`, `LatestValue`, `Reducer`,
 * `Stream`, `Barrier`, `Ephemeral`, `AnyValue` — we never reuse
 * external library identifiers in the public API.
 *
 * The forbidden list is intentionally narrow — we only flag the
 * canonical proper-noun primitives third-party workflow engines use.
 * Rare false positives (e.g. an internal helper named `Send` for an
 * unrelated reason) are mitigated by the per-occurrence opt-out
 * comment `// graphorin-workflow-naming-allow: <reason>`.
 *
 * The rule activates only on files inside the
 * `@graphorin/workflow` package source tree (path matcher
 * `packages/workflow/src`).
 *
 * @packageDocumentation
 */

import type { Rule } from 'eslint';
import type { Identifier, Node } from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const ALLOW_TAG = /graphorin-workflow-naming-allow/;
const WORKFLOW_PATH_RE = /\bpackages\/workflow\/src\b/;

const FORBIDDEN_NAMES: ReadonlyMap<string, string> = new Map([
  ['Send', 'Dispatch'],
  ['Command', 'Directive'],
  ['interrupt', 'pause'],
  ['LastValue', 'LatestValue'],
  ['BinaryOperatorAggregate', 'Reducer'],
  ['BinaryAggregate', 'Reducer'],
  ['Topic', 'Stream'],
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow third-party workflow primitive identifiers in `@graphorin/workflow` source. Graphorin owns its primitive names per DEC-019.',
      recommended: true,
    },
    schema: [],
    messages: {
      forbidden:
        "identifier '{{forbidden}}' is reserved for the third-party workflow library it originates from; use '{{replacement}}' (DEC-019).",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    if (!WORKFLOW_PATH_RE.test(context.filename.replace(/\\/g, '/'))) {
      return {};
    }
    return {
      Identifier(node: Identifier): void {
        const replacement = FORBIDDEN_NAMES.get(node.name);
        if (replacement === undefined) return;
        if (isInImportSpecifier(node)) return;
        if (hasAllowComment(context, node)) return;
        context.report({
          node,
          messageId: 'forbidden',
          data: {
            forbidden: node.name,
            replacement,
          },
        });
      },
    };
  },
};

function isInImportSpecifier(node: Identifier): boolean {
  // Skip identifiers used as keys / property names — those are
  // typically referencing external library exports the user is
  // intentionally importing into a renamed local symbol.
  const parent = (node as Identifier & { parent?: Node }).parent;
  if (parent === undefined) return false;
  switch (parent.type) {
    case 'ImportSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ExportSpecifier':
      return true;
    default:
      return false;
  }
}

function hasAllowComment(context: Rule.RuleContext, node: Identifier): boolean {
  return nodeHasNearbyComment(context, node, ALLOW_TAG, 1);
}

export default rule;
