/**
 * Tool builder surface for `@graphorin/tools`.
 *
 * - {@link tool} - typed factory for declaring a Graphorin tool.
 * - {@link ToolSpec} - the spec accepted by the factory.
 * - {@link resolveTrustClass} / {@link defaultInboundSanitization} /
 *   {@link defaultTruncationStrategy} - pure helpers consumed by the
 *   registry's `register(...)` path.
 *
 * @packageDocumentation
 */

export { type ToolSpec, tool } from './tool.js';
export {
  defaultInboundSanitization,
  defaultTruncationStrategy,
  resolveTrustClass,
} from './trust-class.js';
