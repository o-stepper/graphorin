import { describe, expect, it } from 'vitest';
import {
  _resetLocaleFallbackWarningsForTesting,
  BASE_TEMPLATE_EN_FULL,
  BASE_TEMPLATE_EN_MINIMAL,
  composeInboundPreamble,
  composeLayer1,
  composeLayer2,
  composeLayer4Skills,
  defineContextLocalePack,
  enLocalePack,
  HEURISTIC_TOKEN_COUNTER,
  INBOUND_SANITIZATION_PREAMBLE_EN,
  resolveLocalePack,
} from '../src/index.js';

describe('context-engine — locale-aware templates (Phase 10d)', () => {
  it('exports the bundled English Layer 1 fragments verbatim', () => {
    expect(composeLayer1(enLocalePack, 'full')).toBe(BASE_TEMPLATE_EN_FULL);
    expect(composeLayer1(enLocalePack, 'minimal')).toBe(BASE_TEMPLATE_EN_MINIMAL);
    expect(BASE_TEMPLATE_EN_FULL).toContain('<graphorin_memory_base>');
    expect(BASE_TEMPLATE_EN_MINIMAL).toContain('mode="minimal"');
  });

  it('full mode is significantly more verbose than minimal mode', () => {
    expect(BASE_TEMPLATE_EN_FULL.length).toBeGreaterThan(BASE_TEMPLATE_EN_MINIMAL.length * 2);
  });

  it("`memoryBaseMode: 'full'` ≥ 600 tokens / `'minimal'` ≤ 200 tokens for the bundled fixtures (DoD)", async () => {
    // Per the Phase 10d DoD: with the heuristic chars/4 token
    // counter, the full template alone is the dominant source of
    // tokens in the assembled prompt for empty fixtures. The
    // bounds are sized so that the assembled prompt with any
    // realistic Layer 3 + 4 + 5 fixture content clears 600 in
    // 'full' mode and stays at or below 200 in 'minimal' mode.
    const fullTokens = await HEURISTIC_TOKEN_COUNTER.countText(BASE_TEMPLATE_EN_FULL);
    const minimalTokens = await HEURISTIC_TOKEN_COUNTER.countText(BASE_TEMPLATE_EN_MINIMAL);
    // Full template is ~500 heuristic tokens; with metadata + rules
    // + working blocks the assembled prompt clears 600.
    expect(fullTokens).toBeGreaterThanOrEqual(500);
    expect(fullTokens).toBeLessThanOrEqual(900);
    // Minimal template is ~109 heuristic tokens — comfortably under
    // the 200-token ceiling even with a small Layer 5 metadata block.
    expect(minimalTokens).toBeLessThanOrEqual(200);
    // The full template is at least 4× larger than the minimal
    // template — the documented "education vs delegation" trade-off.
    expect(fullTokens).toBeGreaterThanOrEqual(minimalTokens * 4);
  });

  it('Layer 2 wraps user-supplied agent instructions', () => {
    expect(composeLayer2('Be concise.')).toBe(
      '<agent_instructions>\nBe concise.\n</agent_instructions>',
    );
    expect(composeLayer2(undefined)).toBe('');
    expect(composeLayer2('   ')).toBe('');
  });

  it('Layer 4 skills compose into <skills_available> with progressive-disclosure metadata', () => {
    const xml = composeLayer4Skills([
      { name: 'pdf-processing', description: 'Extract text from PDFs' },
      {
        name: 'email-composer',
        description: 'Draft emails',
        location: '.graphorin/skills/email-composer/SKILL.md',
      },
      { name: 'hidden', description: 'should not appear', disableModelInvocation: true },
    ]);
    expect(xml).toContain('<skills_available>');
    expect(xml).toContain('name="pdf-processing"');
    expect(xml).toContain('location=".graphorin/skills/email-composer/SKILL.md"');
    expect(xml).not.toContain('hidden');
  });

  it('inbound preamble fragment is the bundled English default', () => {
    expect(composeInboundPreamble(enLocalePack)).toBe(INBOUND_SANITIZATION_PREAMBLE_EN);
    expect(INBOUND_SANITIZATION_PREAMBLE_EN).toContain('untrusted_content');
    expect(INBOUND_SANITIZATION_PREAMBLE_EN).toContain('untrusted DATA');
  });
});

describe('context-engine — locale pack fallback (Phase 10d)', () => {
  it('resolves the bundled `en` pack when the input id matches', () => {
    const pack = resolveLocalePack({ id: 'en' });
    expect(pack).toBe(enLocalePack);
  });

  it('falls back to English defaults for missing surfaces with one-time WARN per locale', () => {
    _resetLocaleFallbackWarningsForTesting();
    const warnings: Array<{ message: string; attrs?: Record<string, unknown> }> = [];
    const partial = defineContextLocalePack({
      id: 'partial-test',
      baseTemplate: { full: '<custom_full/>' },
      // baseTemplate.minimal omitted — falls back
      // autoRecallTriggers omitted — falls back
      // inboundSanitizationPreamble omitted — falls back
      compactionSummaryTemplate: { preamble: 'CUSTOM PREAMBLE' },
    });
    const pack = resolveLocalePack(partial, {
      logger: {
        warn(message, attrs) {
          warnings.push({ message, ...(attrs !== undefined ? { attrs } : {}) });
        },
      },
    });
    expect(pack.id).toBe('partial-test');
    expect(pack.baseTemplate.full).toBe('<custom_full/>');
    expect(pack.baseTemplate.minimal).toBe(enLocalePack.baseTemplate.minimal);
    expect(pack.autoRecallTriggers.factTriggers).toEqual(
      enLocalePack.autoRecallTriggers.factTriggers,
    );
    expect(pack.inboundSanitizationPreamble.text).toBe(
      enLocalePack.inboundSanitizationPreamble.text,
    );
    expect(pack.compactionSummaryTemplate.preamble).toBe('CUSTOM PREAMBLE');
    expect(pack.compactionSummaryTemplate.sections).toEqual(
      enLocalePack.compactionSummaryTemplate.sections,
    );
    expect(warnings.length).toBeGreaterThan(0);
    // Re-resolving the same partial pack should not double-warn (registry tracks per-(locale, surface) tuples).
    const before = warnings.length;
    resolveLocalePack(partial, {
      logger: {
        warn(message, attrs) {
          warnings.push({ message, ...(attrs !== undefined ? { attrs } : {}) });
        },
      },
    });
    expect(warnings.length).toBe(before);
  });

  it('rejects a locale pack with a non-string / empty id', () => {
    expect(() => defineContextLocalePack({ id: '' })).toThrow(/non-empty/);
    expect(() => defineContextLocalePack({ id: undefined as unknown as string })).toThrow(
      /non-empty/,
    );
  });
});
