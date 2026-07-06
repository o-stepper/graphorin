import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/tools-harness-tour`. Everything runs fully
 * offline against the in-process MCP server (InMemoryTransport linked
 * pair) - no network, no child processes, no LLM provider:
 *
 *  1. `runTour()` completes and every stage invariant holds: the MCP
 *     catalogue is adapted and registered, the skill loads and its
 *     declared tool is stamped+registered, `tool_search` finds the
 *     deferred `unit_convert`, the code-mode script returns the expected
 *     deterministic values, the large MCP payload spills to a run-scoped
 *     handle, and `read_result` pages the full artifact back.
 *  2. `main()` returns exit code 0 and prints the final
 *     `tools-harness-tour: OK` line.
 *  3. The skill loader surfaces the Tier-1 metadata card and the stamp
 *     applies the untrusted-source defaults.
 *  4. The large payload fixture is deterministic and clears the 100 KB
 *     floor.
 */

import { describe, expect, it } from 'vitest';

import { main, runTour, TOUR_RUN_ID, VERSION } from '../src/main.js';
import { buildAtlasPayload, LARGE_PAYLOAD_MIN_BYTES } from '../src/mcp-server.js';
import { loadOfflineNotesSkill } from '../src/skill.js';

describe('tools-harness-tour', () => {
  it('runs the full tour offline and every stage invariant holds', async () => {
    const stageLines: string[] = [];
    const report = await runTour({ log: (line) => stageLines.push(line) });

    // Stage 1+2 - MCP server catalogue adapted into the registry.
    expect(report.mcpServerToolCount).toBe(3);
    expect(report.mcpAdaptedCount).toBe(3);
    // 3 MCP + note_lookup + unit_convert + char_count + tool_search +
    // read_result + code_search + code_execute.
    expect(report.toolsRegistered).toBe(10);
    expect(report.lookupOutput).toContain('Kyiv');
    // MCP-derived results come back inside the untrusted-content envelope.
    expect(report.lookupOutput).toContain('<<<untrusted_content');

    // Stage 3 - skill loaded, declared tool registered and callable.
    expect(report.skillName).toBe('offline-notes');
    expect(report.skillTrustLevel).toBe('untrusted');
    expect(report.skillToolName).toBe('note_lookup');
    expect(report.noteOutput).toContain('run-scoped');
    expect(report.noteOutput).toContain('<<<untrusted_content');

    // Stage 4 - the deferred tool is found via tool_search.
    expect(report.deferredCount).toBe(1);
    expect(report.searchHits).toContain('unit_convert');

    // Stage 5 - deterministic code-mode outcome.
    expect(report.codeChars).toBe(28);
    expect(report.codeMeters).toBe(28_000);

    // Stage 6 - spill handle produced (run-scoped) and paged back fully.
    expect(report.spillHandle.startsWith(`graphorin-spill:${TOUR_RUN_ID}/`)).toBe(true);
    expect(report.spillBytes).toBeGreaterThan(LARGE_PAYLOAD_MIN_BYTES);
    expect(report.firstPageBytes).toBeGreaterThan(0);
    expect(report.pagesRead).toBeGreaterThanOrEqual(2);
    expect(report.pagedBytesTotal).toBe(report.spillBytes);

    // Final line + stage lines.
    expect(report.finalLine).toContain('tools-harness-tour: OK');
    expect(report.finalLine).toContain(`graphorin v${pkgVersion}`);
    expect(VERSION).toBe(pkgVersion);
    expect(stageLines).toHaveLength(6);
    expect(stageLines[0]).toContain('[1/6] mcp-server:');
    expect(stageLines[5]).toContain('read_result paged it back');
  });

  it('main() exits 0 and prints the OK line', async () => {
    const written: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array): boolean => {
      written.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    let exitCode: number;
    try {
      exitCode = await main();
    } finally {
      process.stdout.write = original;
    }
    expect(exitCode).toBe(0);
    const stdout = written.join('');
    expect(stdout).toContain('tools-harness-tour: OK');
    expect(stdout).toContain(`graphorin v${pkgVersion}`);
  });

  it('loads the skill folder and stamps the declared tool with untrusted defaults', async () => {
    const { skill, stamped } = await loadOfflineNotesSkill();
    // Tier-1 metadata card (available without reading body/resources).
    expect(skill.metadata.name).toBe('offline-notes');
    expect(skill.metadata.description).toContain('release notes');
    expect(skill.metadata.graphorinTrustLevel).toBe('untrusted');
    expect(skill.toolDeclarations()).toHaveLength(1);
    expect(skill.toolDeclarations()[0]?.name).toBe('note_lookup');
    // The stamp derives the skill source and forces the untrusted defaults.
    expect(stamped.source).toEqual({
      kind: 'skill',
      skillName: 'offline-notes',
      trustLevel: 'untrusted',
    });
    expect(stamped.tool.inboundSanitization).toBe('detect-and-strip-and-wrap');
    expect(stamped.tool.sandboxPolicy).not.toBe('none');
  });

  it('builds a deterministic >100 KB atlas payload', () => {
    const first = buildAtlasPayload();
    const second = buildAtlasPayload();
    expect(second).toBe(first);
    expect(Buffer.byteLength(first, 'utf8')).toBeGreaterThan(LARGE_PAYLOAD_MIN_BYTES);
    expect(first).toContain('atlas row 0000');
  });
});
