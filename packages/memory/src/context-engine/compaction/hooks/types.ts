/**
 * Built-in post-compaction hooks (RB-46 § 5.2). Three hooks ship by
 * default; each returns `MessageContent[]` parts the harness
 * appends to the trimmed buffer as system-content fragments,
 * re-injecting Context Essentials (project rules, persona block,
 * pinned facts) into the assembled prompt's Layer 1-4 territory
 * before the cache breakpoint.
 *
 * The hooks are independent of one another - the default order
 * `[reanchorProjectRules(), reanchorPersonaBlock(),
 * reanchorPinnedFacts({ pinnedFactIds: [] })]` is what operators
 * get out of the box without explicit wiring. A hook that throws
 * is caught + WARN-logged + the harness continues with the
 * remaining hooks (defense-in-depth: one buggy hook does not
 * break the run).
 *
 * @packageDocumentation
 */

import type { MessageContent, Sensitivity, SessionScope } from '@graphorin/core';
import type { Memory } from '../../../facade.js';

/**
 * Resolved dependency surface every built-in hook reads. Threaded
 * through Phase 12's lifecycle; tests pass a fixture
 * implementation.
 *
 * @stable
 */
export interface HookDeps {
  readonly memory: Memory;
  readonly scope: SessionScope;
  /** Optional context tags surfaced to the procedural-rules query. */
  readonly procedural?: { readonly topic?: string; readonly tags?: ReadonlyArray<string> };
  /**
   * D2 privacy evaluator threaded from the engine's resolved privacy
   * config (context-engine-02). `true` = the provider may see content of
   * this sensitivity. Built-in hooks MUST consult it before re-injecting
   * tier content: `assemble()` filters what ships to the provider, and
   * the post-compaction splice ships to the SAME provider - without the
   * check, a `secret`-tier persona block / rule / pinned fact that the
   * assembly correctly withheld leaks on the first compaction. Absent
   * (operator-built HookDeps) means no filtering; the engine always
   * supplies one.
   */
  readonly allowSensitivity?: (sensitivity: Sensitivity | undefined) => boolean;
}

/**
 * Tagged hook returned by every factory below. The `id` field is
 * surfaced on the `context.compaction.hook.executed.total{hookName}`
 * counter family.
 *
 * @stable
 */
export interface NamedPostCompactionHook {
  readonly id: string;
  /**
   * `ctx` carries the REAL compaction outcome (CE-6) - result, scope,
   * runId, sessionId, agentId, source - built by `compactNow` after the
   * pipeline finishes. Record-form built-ins may ignore it; the
   * function-form wrapper forwards it to the operator's hook verbatim.
   */
  resolveContent(
    deps: HookDeps,
    ctx?: import('../types.js').PostCompactionHookContext,
  ): Promise<ReadonlyArray<MessageContent>>;
}
