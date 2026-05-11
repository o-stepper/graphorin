/**
 * Tracer surface for `@graphorin/observability`.
 *
 * @packageDocumentation
 */

export { newSpanId, newTraceId } from './ids.js';
export {
  createSampler,
  type Sampler,
  type SamplingDecisionMaker,
  type SamplingOptions,
  type SamplingRule,
} from './sampling.js';
export type { GraphorinSpan, SetAttributeOptions } from './span.js';
export { spanNameFor } from './span-names.js';
export {
  asGraphorinSpan,
  createTracer,
  type GraphorinTracer,
  type TracerOptions,
} from './tracer.js';
