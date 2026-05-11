/**
 * Public surface of the per-step tool-catalogue allocator (RB-44).
 *
 * @packageDocumentation
 */

export { allocateToolCatalogue, updateLazyLoadedSet } from './allocator.js';
export type {
  DeferralSource,
  LazyLoadedToolEntry,
  ToolBudgetEntry,
  ToolCatalogueInput,
  ToolCatalogueResult,
  ToolRanker,
} from './types.js';
