import type { SessionScope } from '@graphorin/core';
import type { EpisodicMemory } from '../tiers/episodic-memory.js';
import type { ProceduralMemory } from '../tiers/procedural-memory.js';
import type { SemanticMemory } from '../tiers/semantic-memory.js';
import type { SessionMemory } from '../tiers/session-memory.js';
import type { SharedMemory } from '../tiers/shared-memory.js';
import type { WorkingMemory } from '../tiers/working-memory.js';

/**
 * Resolver that produces the live {@link SessionScope} for the tool
 * call from the surrounding agent run context. The agent runtime
 * (Phase 12) supplies a closure that reads `RunContext` directly;
 * standalone callers can pass a fixed scope.
 *
 * @stable
 */
export type ScopeResolver = (
  ctx: import('@graphorin/core').ToolExecutionContext<unknown>,
) => SessionScope | Promise<SessionScope>;

/**
 * Dependency bundle threaded into every memory tool. Exposed
 * separately from the `Tool` surface so the executor can scope
 * the dependencies per call without leaking the wider memory facade
 * into the tool author surface.
 *
 * @stable
 */
export interface MemoryToolDeps {
  readonly working: WorkingMemory;
  readonly session: SessionMemory;
  readonly episodic: EpisodicMemory;
  readonly semantic: SemanticMemory;
  readonly procedural: ProceduralMemory;
  readonly shared: SharedMemory;
  readonly resolveScope: ScopeResolver;
}
