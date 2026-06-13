/**
 * SOTA-6: add "Errors encountered and resolutions" + "Next steps" to the
 * compaction summary template. Claude Code and Manus independently found these
 * the two costliest omissions — without them the agent repeats already-fixed
 * errors and loses direction after a compaction. The harness-filled sections
 * (recent turns + metadata) stay the last two regardless of how many LLM
 * sections precede them.
 */

import { describe, expect, it } from 'vitest';
import { buildSummarizerPrompt, enLocalePack, SUMMARY_TEMPLATE_VERSION } from '../src/index.js';

const sections = enLocalePack.compactionSummaryTemplate.sections;

describe('SOTA-6: Errors + Next-steps summary sections', () => {
  it('includes the two costliest-omission sections', () => {
    expect(sections).toContain('Errors encountered and resolutions');
    expect(sections).toContain('Next steps');
  });

  it('asks the summarizer for them; marks the last two (harness-filled) do-not-generate', () => {
    const prompt = buildSummarizerPrompt({
      template: { preamble: enLocalePack.compactionSummaryTemplate.preamble, sections },
      olderMessages: [{ role: 'user', content: 'hi' }],
    });
    // LLM-produced sections — present, NOT flagged as harness-filled.
    expect(prompt).toContain('Errors encountered and resolutions\n');
    expect(prompt).toContain('Next steps\n');
    // The last two stay harness-filled no matter how many LLM sections precede.
    expect(prompt).toContain(
      'Recent turns preserved verbatim (filled by harness; do NOT generate)',
    );
    expect(prompt).toContain('Compaction metadata (filled by harness; do NOT generate)');
  });

  it('bumps the template version', () => {
    expect(SUMMARY_TEMPLATE_VERSION).toBe('1.2');
  });
});
