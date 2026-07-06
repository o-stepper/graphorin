/**
 * W-056: the single source of the compaction-summary wrapper marker.
 *
 * The string is a cross-package protocol: the memory package stamps it
 * around every rendered compaction summary ({@link renderFinalSummary}),
 * and the agent runtime's prefix scan (`countLeadingSystemMessages`)
 * stops at it so a compact-then-suspend cycle cannot absorb summaries
 * into the uncompactable prefix. It used to be defined independently in
 * both packages; the agent now imports these constants.
 *
 * The VALUE is frozen: persisted summaries in existing session stores
 * carry it, so changing the tag would orphan them. Pin tests in both
 * packages assert the raw literal.
 *
 * @packageDocumentation
 */

/** Bare tag name (no angle brackets). @stable */
export const COMPACTION_SUMMARY_TAG = 'graphorin_compaction_summary';

/** Opening wrapper line of a rendered summary. @stable */
export const COMPACTION_SUMMARY_OPEN = `<${COMPACTION_SUMMARY_TAG}>`;

/** Closing wrapper line of a rendered summary. @stable */
export const COMPACTION_SUMMARY_CLOSE = `</${COMPACTION_SUMMARY_TAG}>`;

/**
 * Detection prefix - the opening tag WITHOUT the trailing `>` so a
 * `startsWith` scan also matches any future attribute-carrying variant.
 *
 * @stable
 */
export const COMPACTION_SUMMARY_MARKER = `<${COMPACTION_SUMMARY_TAG}`;
