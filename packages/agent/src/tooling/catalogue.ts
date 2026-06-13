/**
 * A7 (SOTA): prompt-cache-aware tool-catalogue ordering.
 *
 * The per-step catalogue is `[...eagerTools, ...promotedTools, ...handoffTools]`.
 * The eager prefix is already stable (the registry lists in insertion order), so
 * the only source of churn is the promoted section: building it from the
 * registry's `listDeferred` order means a tool promoted on a later step can sort
 * BEFORE one promoted earlier, shifting the serialized suffix and invalidating
 * the provider's prompt-cache prefix on every subsequent step.
 *
 * `orderPromotedTools` instead emits promoted tools in PROMOTION order (the
 * insertion order of the promoted-name set), so a newly promoted tool always
 * joins the END — the catalogue grows append-only and earlier promotions keep
 * their byte position. A long-running assistant re-pays only for the new tail.
 *
 * @packageDocumentation
 */

/**
 * Resolve `promotedNames` (insertion-ordered) to the matching `deferred`
 * entries, preserving promotion order. Names absent from the pool (e.g. a tool
 * removed mid-run) are skipped.
 */
export function orderPromotedTools<T extends { readonly name: string }>(
  promotedNames: Iterable<string>,
  deferred: ReadonlyArray<T>,
): ReadonlyArray<T> {
  const byName = new Map<string, T>();
  for (const tool of deferred) byName.set(tool.name, tool);
  const out: T[] = [];
  for (const name of promotedNames) {
    const tool = byName.get(name);
    if (tool !== undefined) out.push(tool);
  }
  return out;
}
