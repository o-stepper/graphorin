/**
 * RB-49 discovery + threshold + JSON-schema acceptance tests for
 * `graphorin tools lint`. Builds a fake operator project on disk
 * (with a `tsconfig.json` whose `include` field constrains the walk)
 * and verifies the spec-required behaviours:
 *
 *  - 3 tools across `src/tools/a.ts` + `src/tools/b.ts` +
 *    `src/skills/c/tools/d.ts` are discovered.
 *  - `--source 'src/skills/**\/tools/*.ts'` produces only the
 *    skill-bundled tool.
 *  - `--threshold 60` exits `1` when any tool falls below; `--threshold
 *    0` exits `0` regardless of scores.
 *  - `--format json` emits the documented schema.
 *  - The `tool.lint.threshold.violations.total` counter sink fires
 *    once per below-threshold tool per invocation.
 */

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  runToolsLint,
  type ToolsLintReport,
  type ToolsLintThresholdViolation,
} from '../src/commands/tools-lint.js';

const WELL_DESCRIBED = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const wellDescribedTool = tool({
  name: 'search_issues',
  description: 'Search the ticket tracker for open issues. Use when the user references a ticket or sprint by id.',
  inputSchema: z.object({ query: z.string() }),
  examples: [
    { input: { query: 'API outage' }, output: { issues: [] }, comment: 'Use for issue tracker.' },
  ],
});
`;

const PLACEHOLDER = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const placeholderDescriptionTool = tool({
  name: 'do_thing',
  description: 'TBD',
  inputSchema: z.object({ arg1: z.string() }),
});
`;

const SKILL_BUNDLED = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const skillBundledTool = tool({
  name: 'render_card',
  description: 'Render a quick-reply card from skill metadata. Use when the operator asked to preview a skill.',
  inputSchema: z.object({ skillId: z.string() }),
  examples: [
    { input: { skillId: 'demo' }, output: { html: '<div></div>' } },
  ],
});
`;

async function makeProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'graphorin-tools-lint-'));
  await writeFile(
    join(root, 'tsconfig.json'),
    JSON.stringify({ include: ['src/**/*.ts'], compilerOptions: { strict: true } }, null, 2),
    'utf8',
  );
  await mkdir(join(root, 'src', 'tools'), { recursive: true });
  await mkdir(join(root, 'src', 'skills', 'c', 'tools'), { recursive: true });
  await writeFile(join(root, 'src', 'tools', 'a.ts'), WELL_DESCRIBED, 'utf8');
  await writeFile(join(root, 'src', 'tools', 'b.ts'), PLACEHOLDER, 'utf8');
  await writeFile(join(root, 'src', 'skills', 'c', 'tools', 'd.ts'), SKILL_BUNDLED, 'utf8');
  return root;
}

describe('graphorin tools lint — RB-49 acceptance', () => {
  let savedExitCode: typeof process.exitCode;
  beforeEach(() => {
    savedExitCode = process.exitCode;
    process.exitCode = 0;
  });
  afterEach(() => {
    process.exitCode = savedExitCode;
  });

  it('discovers all three tools when no --source override is supplied', async () => {
    const root = await makeProject();
    const report = await runToolsLint({
      cwd: root,
      threshold: 0,
      print: () => undefined,
    });
    expect(report.summary.totalTools).toBe(3);
    const names = report.tools.map((t) => t.name).sort();
    expect(names).toEqual(['do_thing', 'render_card', 'search_issues']);
  });

  it('honours --source override (skill-bundled tools only)', async () => {
    const root = await makeProject();
    const report = await runToolsLint({
      cwd: root,
      source: 'src/skills/**/tools/*.ts',
      threshold: 0,
      print: () => undefined,
    });
    expect(report.summary.totalTools).toBe(1);
    expect(report.tools[0]?.name).toBe('render_card');
  });

  it('--threshold 60 exits 1 when any tool falls below', async () => {
    const root = await makeProject();
    process.exitCode = 0;
    const report = await runToolsLint({
      cwd: root,
      threshold: 60,
      print: () => undefined,
    });
    expect(report.summary.failed).toBeGreaterThan(0);
    expect(process.exitCode).toBe(1);
  });

  it('--threshold 0 passes every project regardless of scores', async () => {
    const root = await makeProject();
    process.exitCode = 0;
    await runToolsLint({
      cwd: root,
      threshold: 0,
      print: () => undefined,
    });
    expect(process.exitCode).toBe(0);
  });

  it('counter sink fires once per below-threshold tool per invocation', async () => {
    const root = await makeProject();
    const events: ToolsLintThresholdViolation[] = [];
    await runToolsLint({
      cwd: root,
      threshold: 60,
      counterSink: (event) => events.push(event),
      print: () => undefined,
    });
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(e.threshold).toBe(60);
      expect(e.score).toBeLessThan(60);
      expect(typeof e.toolName).toBe('string');
    }
  });

  it('--format json emits the documented schema', async () => {
    const root = await makeProject();
    const captured: ToolsLintReport[] = [];
    await runToolsLint({
      cwd: root,
      threshold: 60,
      format: 'json',
      jsonPrint: (payload) => captured.push(payload as ToolsLintReport),
    });
    expect(captured).toHaveLength(1);
    const report = captured[0];
    if (report === undefined) throw new Error('expected json payload');
    expect(report.summary).toEqual(
      expect.objectContaining({
        totalTools: 3,
        threshold: 60,
        passed: expect.any(Number),
        failed: expect.any(Number),
        totalFindings: expect.any(Number),
      }),
    );
    for (const t of report.tools) {
      expect(t).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          source: expect.stringMatching(/.*:\d+$/),
          score: expect.any(Number),
          axes: expect.objectContaining({
            description: expect.any(Number),
            examples: expect.any(Number),
            parameterNaming: expect.any(Number),
          }),
          findings: expect.any(Array),
        }),
      );
      for (const f of t.findings) {
        expect(f).toEqual(
          expect.objectContaining({
            rule: expect.stringMatching(/^graphorin\/tool-/),
            kind: expect.any(String),
            severity: expect.stringMatching(/error|warn|info/),
            message: expect.any(String),
            location: expect.objectContaining({
              file: expect.any(String),
              line: expect.any(Number),
            }),
          }),
        );
      }
    }
  });

  it('--format text highlights below-threshold tools with an unambiguous marker', async () => {
    const root = await makeProject();
    const lines: string[] = [];
    await runToolsLint({
      cwd: root,
      threshold: 60,
      format: 'text',
      print: (line) => lines.push(line),
    });
    const joined = lines.join('\n');
    expect(joined).toMatch(/BELOW THRESHOLD/);
    expect(joined).toMatch(/\[FAIL\] do_thing/);
    expect(joined).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
