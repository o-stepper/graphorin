/**
 * Convenience re-export of the English Layer 1 base-template
 * fragments so call sites can import the bundled defaults without
 * dragging the full locale pack.
 *
 * The framework is locale-agnostic — no language is privileged in
 * core. Application code can register additional locales via
 * `defineContextLocalePack`.
 *
 * @packageDocumentation
 */

import { enLocalePack } from '../locale-packs/en.js';

/** English Layer 1 in `'full'` mode (~250-350 tokens). */
export const BASE_TEMPLATE_EN_FULL = enLocalePack.baseTemplate.full;

/** English Layer 1 in `'minimal'` mode (~80-120 tokens). */
export const BASE_TEMPLATE_EN_MINIMAL = enLocalePack.baseTemplate.minimal;
