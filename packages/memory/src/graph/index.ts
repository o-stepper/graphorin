/**
 * Lightweight in-SQLite relation graph (P2-1): entity resolution +
 * one-hop expansion. The store-side persistence + recursive CTE live in
 * the adapter's `graph` capability (`@graphorin/store-sqlite`); this
 * sub-module is the provider-agnostic resolution policy.
 *
 * @packageDocumentation
 */

export {
  buildAdjudicationRequest,
  cosineSimilarity,
  DEFAULT_ADJUDICATE_THRESHOLD,
  DEFAULT_MERGE_THRESHOLD,
  type EntityResolutionConfig,
  type EntityResolveDecision,
  EntityResolver,
  type EntityResolverDeps,
  normalizeEntityName,
  parseAdjudication,
  type ResolutionCandidate,
  type ResolveDecisionInput,
  resolveEntityDecision,
} from './entity-resolver.js';
