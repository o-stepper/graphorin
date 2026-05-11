/**
 * Public surface of the ContextEngine locale-pack module. The
 * bundled English pack ({@link enLocalePack}) is the default and the
 * fallback surface for every partial locale pack a consumer
 * registers via {@link defineContextLocalePack}.
 *
 * @packageDocumentation
 */

export { enLocalePack } from './en.js';
export {
  type AutoRecallTriggers,
  type BaseTemplateFragments,
  type CompactionSummaryTemplate,
  type ContextLocalePack,
  defineContextLocalePack,
  type InboundSanitizationPreamble,
  type PartialContextLocalePack,
} from './types.js';
