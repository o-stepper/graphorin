/**
 * Comment-scanning helpers shared by the rule modules. We use raw
 * `getAllComments` + line-distance heuristics instead of `getComments
 * Before / Inside / After` because ESLint's per-node comment attachment
 * leaves orphan comments at the program top-level when the node
 * itself is nested inside an expression statement.
 */

import type { Rule } from 'eslint';
import type { Comment, Node } from 'estree';

/**
 * Returns `true` when the source contains a comment whose `value`
 * matches `tag` and which is positioned within `1` line of `node`'s
 * start, or anywhere inside `node`'s span.
 *
 * @internal
 */
export function nodeHasNearbyComment(
  context: Rule.RuleContext,
  node: Node,
  tagPattern: RegExp,
  maxGap: number = 1,
): boolean {
  const startLine = node.loc?.start.line ?? 0;
  const endLine = node.loc?.end.line ?? Number.POSITIVE_INFINITY;
  const allComments = context.sourceCode.getAllComments() as Comment[];
  for (const c of allComments) {
    if (!tagPattern.test(c.value)) continue;
    const cStart = c.loc?.start.line ?? 0;
    const cEnd = c.loc?.end.line ?? 0;
    if (cEnd <= startLine && startLine - cEnd <= maxGap) return true;
    if (cStart >= startLine && cStart <= endLine) return true;
    if (cStart >= endLine && cStart - endLine <= maxGap) return true;
  }
  return false;
}
