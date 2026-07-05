/**
 * Layer 1 base-template composer. Resolves the locale pack, picks
 * the right base fragment based on `memoryBaseMode`, and exposes
 * the per-step inbound preamble as an additive Layer 5/6 fragment
 * (so the Layer 1-4 cache prefix stays bytes-equal across the run).
 *
 * @packageDocumentation
 */

import type { ContextLocalePack } from '../locale-packs/index.js';

/**
 * Layer 1 mode discriminator. `'full'` ships the full educational
 * template (~250-350 tok); `'minimal'` ships the shortened version
 * (~80-120 tok) for top-tier models.
 *
 * @stable
 */
export type MemoryBaseMode = 'full' | 'minimal';

/**
 * Compose Layer 1 from the resolved locale pack.
 *
 * @stable
 */
export function composeLayer1(pack: ContextLocalePack, mode: MemoryBaseMode): string {
  return mode === 'minimal' ? pack.baseTemplate.minimal : pack.baseTemplate.full;
}

/**
 * Render the optional Layer 2 (`agent_instructions`) wrapper.
 * Returns the empty string when `instructions` is empty so the
 * layer is dropped from the assembled prompt.
 *
 * @stable
 */
export function composeLayer2(instructions: string | undefined): string {
  if (instructions === undefined || instructions.trim().length === 0) return '';
  return `<agent_instructions>\n${instructions}\n</agent_instructions>`;
}

/**
 * Render Layer 4 skills metadata cards. Each entry is a
 * `<skill ... />` self-closing tag so the model sees only the
 * progressive-disclosure metadata - the full SKILL.md body is
 * loaded on-demand via `activate_skill(name)` per RB-04.
 *
 * @stable
 */
export interface SkillMetadataCard {
  readonly name: string;
  readonly description: string;
  readonly location?: string;
  /** When `true`, the card is excluded from the assembled prompt. */
  readonly disableModelInvocation?: boolean;
}

export function composeLayer4Skills(cards: ReadonlyArray<SkillMetadataCard>): string {
  const visible = cards.filter((c) => c.disableModelInvocation !== true);
  if (visible.length === 0) return '';
  const lines = ['<skills_available>'];
  for (const card of visible) {
    const description = ` description="${escapeXmlAttr(card.description)}"`;
    const location =
      card.location !== undefined ? ` location="${escapeXmlAttr(card.location)}"` : '';
    lines.push(`  <skill name="${escapeXmlAttr(card.name)}"${description}${location} />`);
  }
  lines.push('</skills_available>');
  return lines.join('\n');
}

/**
 * Render the inbound-sanitization preamble fragment. Emitted
 * AFTER the cache breakpoint so the Layer 1-4 cache prefix is
 * unaffected. Caller threads the fragment into the system content
 * post-Layer 5; the fragment is returned as a string so the
 * caller does not need to know the cache-breakpoint policy.
 *
 * @stable
 */
export function composeInboundPreamble(pack: ContextLocalePack): string {
  return pack.inboundSanitizationPreamble.text;
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
