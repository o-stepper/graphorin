/**
 * OpenInference span-kind emission. Adds the
 * `openinference.span.kind` attribute (one of `AGENT`, `EVALUATOR`,
 * `LLM`, `TOOL`, `RETRIEVER`, `EMBEDDING`, `CHAIN`) to applicable
 * Graphorin spans.
 *
 * The mapping is the canonical table published in the architecture
 * documentation. Span types without a clean OpenInference equivalent
 * (`skill.*`, `mcp.connect`, `mcp.list-tools`, `replay.*`) are NOT
 * emitted - the caller can introspect via {@link openInferenceKindFor}
 * and decide whether to log a fallback attribute.
 *
 * @packageDocumentation
 */

import type { AISpan, SpanType } from '@graphorin/core';

import { asGraphorinSpan } from '../tracer/tracer.js';

/**
 * Canonical OpenInference span-kind enum.
 *
 * @stable
 */
export type OpenInferenceSpanKind =
  | 'AGENT'
  | 'EVALUATOR'
  | 'LLM'
  | 'TOOL'
  | 'RETRIEVER'
  | 'EMBEDDING'
  | 'CHAIN'
  | 'RERANKER';

const KIND_TABLE: ReadonlyArray<readonly [SpanType, OpenInferenceSpanKind]> = Object.freeze([
  ['agent.run', 'AGENT'],
  ['agent.step', 'AGENT'],
  ['agent.handoff', 'AGENT'],
  ['agent.suspend', 'AGENT'],
  ['agent.resume', 'AGENT'],

  ['provider.generate', 'LLM'],
  ['provider.stream', 'LLM'],

  ['tool.execute', 'TOOL'],
  ['tool.approval', 'TOOL'],

  ['memory.read.working', 'RETRIEVER'],
  ['memory.read.session', 'RETRIEVER'],
  ['memory.read.episodic', 'RETRIEVER'],
  ['memory.read.semantic', 'RETRIEVER'],
  ['memory.read.procedural', 'RETRIEVER'],
  ['memory.read.shared', 'RETRIEVER'],
  ['memory.read.insight', 'RETRIEVER'], // ORPHAN-SU-01
  ['memory.write.working', 'RETRIEVER'],
  ['memory.write.session', 'RETRIEVER'],
  ['memory.write.episodic', 'RETRIEVER'],
  ['memory.write.semantic', 'RETRIEVER'],
  ['memory.write.procedural', 'RETRIEVER'],
  ['memory.write.shared', 'RETRIEVER'],
  ['memory.write.insight', 'RETRIEVER'], // ORPHAN-SU-01
  ['memory.search.working', 'RETRIEVER'],
  ['memory.search.session', 'RETRIEVER'],
  ['memory.search.episodic', 'RETRIEVER'],
  ['memory.search.semantic', 'RETRIEVER'],
  ['memory.search.procedural', 'RETRIEVER'],
  ['memory.search.shared', 'RETRIEVER'],
  ['memory.search.insight', 'RETRIEVER'], // ORPHAN-SU-01

  ['memory.embed', 'EMBEDDING'],

  ['memory.consolidate.light', 'CHAIN'],
  ['memory.consolidate.standard', 'CHAIN'],
  ['memory.consolidate.deep', 'CHAIN'],
  // ORPHAN-SU-01: the insight tier + learned-context / curated-block /
  // profile-projection / promotion consolidate phases are all reasoning chains.
  ['memory.consolidate.reflect', 'CHAIN'],
  ['memory.consolidate.learned-context', 'CHAIN'],
  ['memory.consolidate.curated-block', 'CHAIN'],
  ['memory.consolidate.profile-projection', 'CHAIN'],
  ['memory.consolidate.promotion', 'CHAIN'],
  ['memory.conflict', 'CHAIN'],
  ['workflow.run', 'CHAIN'],
  ['workflow.step', 'CHAIN'],
  ['workflow.task', 'CHAIN'],
  ['workflow.checkpoint', 'CHAIN'],

  ['mcp.call', 'TOOL'],
] as const);

/**
 * Span types intentionally excluded from OpenInference span-kind
 * emission per the canonical table - `skill.*`, `mcp.connect`,
 * `mcp.list-tools`, and `replay.*` markers do not have a clean
 * OpenInference equivalent.
 *
 * @stable
 */
export const OPEN_INFERENCE_EXCLUDED_TYPES: ReadonlyArray<SpanType> = Object.freeze([
  'skill.activate',
  'skill.load',
  'mcp.connect',
  'mcp.list-tools',
] as const);

const KIND_LOOKUP = new Map<SpanType, OpenInferenceSpanKind>(KIND_TABLE);

/**
 * Resolve the OpenInference span kind for a Graphorin span type.
 * Returns `null` for types intentionally excluded from emission.
 *
 * @stable
 */
export function openInferenceKindFor<T extends SpanType>(type: T): OpenInferenceSpanKind | null {
  return KIND_LOOKUP.get(type) ?? null;
}

/**
 * Attach the `openinference.span.kind` attribute to a span. No-op for
 * span types that lack a clean OpenInference equivalent. The attribute
 * is tagged `'public'` because the enum value is bounded and contains
 * no PII.
 *
 * @stable
 */
export function emitOpenInferenceKind<T extends SpanType>(span: AISpan<T>): void {
  const kind = KIND_LOOKUP.get(span.type);
  if (kind === undefined) return;
  const gs = asGraphorinSpan(span);
  if (gs !== null) {
    gs.setAttribute('openinference.span.kind', kind, { sensitivity: 'public' });
  } else {
    span.setAttributes({ 'openinference.span.kind': kind });
  }
}

/**
 * Full canonical span-to-kind table - exposed for tooling and tests
 * that need to introspect the mapping.
 *
 * @stable
 */
export const OPEN_INFERENCE_KIND_TABLE = KIND_TABLE;
