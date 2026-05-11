/**
 * Convenience re-export of the English D4 inbound-sanitization
 * preamble. Lives at the documented path
 * `@graphorin/memory/context-engine/preambles/inbound-en.ts` so
 * Phase 12 (agent runtime) can import it directly when wiring
 * the per-step preamble injection.
 *
 * The framework is locale-agnostic — additional preambles plug in
 * through `defineContextLocalePack({ inboundSanitizationPreamble:
 * { text } })`. A partial locale pack falls back to this English
 * default with a one-time WARN per locale.
 *
 * @packageDocumentation
 */

import { enLocalePack } from '../locale-packs/en.js';

/** English D4 preamble text (~80-120 tokens, cache-friendly). */
export const INBOUND_SANITIZATION_PREAMBLE_EN = enLocalePack.inboundSanitizationPreamble.text;
