/**
 * Six tier sub-modules for `@graphorin/memory`. Imported by the
 * `createMemory()` facade; consumers can also instantiate a tier
 * directly when wiring the package against a custom `MemoryStore`.
 *
 * @packageDocumentation
 */

export {
  type EpisodeInput,
  type EpisodeRetrievalWeights,
  type EpisodeSearchOptions,
  EpisodicMemory,
} from './episodic-memory.js';
export {
  capInsightsBelowFacts,
  type InsightListOptions,
  InsightMemory,
  type InsightSearchOptions,
} from './insight-memory.js';
export {
  type InduceOptions,
  ProceduralMemory,
  type RuleActivationContext,
  type RuleInput,
} from './procedural-memory.js';
export {
  type FactInput,
  type FactRememberOptions,
  type FactSearchOptions,
  type FusionStrategy,
  type FusionWeights,
  type IterativeRecallResult,
  type IterativeSearchOptions,
  type RememberOutcome,
  SemanticMemory,
} from './semantic-memory.js';
export {
  type SessionCompactionPolicy,
  type SessionCompactionResult,
  SessionMemory,
} from './session-memory.js';
export { SharedMemory } from './shared-memory.js';
export {
  type BlockDefinition,
  type BlockSpec,
  defineBlock,
  WorkingMemory,
} from './working-memory.js';
