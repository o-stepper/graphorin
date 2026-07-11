import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runToolsLint } from '../src/commands/tools-lint.js';

const WELL_DESCRIBED = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const sendEmail = tool({
  name: 'search_issues',
  description: 'Search the ticket tracker for open issues. Use when the user references a ticket or sprint by id.',
  inputSchema: z.object({
    query: z.string(),
  }),
  examples: [
    { input: { query: 'API outage' }, output: { issues: [] }, comment: 'Use for issue tracker.' },
  ],
});
`;

const PLACEHOLDER_DESC = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const placeholder = tool({
  name: 'placeholder_tool',
  description: 'TODO',
  inputSchema: z.object({ user: z.string(), id: z.string() }),
  execute: async () => undefined,
});
`;

const NO_EXAMPLES = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const noExamples = tool({
  name: 'no_examples_tool',
  description: 'A reasonably long description that should pass the description-length check.',
  inputSchema: z.object({ recipientId: z.string() }),
  execute: async () => undefined,
});
`;

describe('graphorin tools lint', () => {
  it('discovers + scores three tools across multiple files', async () => {
    const report = await runToolsLint({
      inlineSources: [
        { file: 'src/tools/well-described.ts', source: WELL_DESCRIBED },
        { file: 'src/tools/placeholder.ts', source: PLACEHOLDER_DESC },
        { file: 'src/skills/c/tools/no-examples.ts', source: NO_EXAMPLES },
      ],
      threshold: 60,
      print: () => undefined,
    });
    expect(report.summary.totalTools).toBe(3);
    const placeholderScore = report.tools.find((t) => t.name === 'placeholder_tool');
    expect(placeholderScore?.score).toBeLessThan(60);
    const wellScore = report.tools.find((t) => t.name === 'search_issues');
    expect(wellScore?.score).toBeGreaterThanOrEqual(60);
  });

  it('reports a non-zero number of failed tools when below threshold', async () => {
    const report = await runToolsLint({
      inlineSources: [{ file: 'src/tools/p.ts', source: PLACEHOLDER_DESC }],
      threshold: 60,
      print: () => undefined,
    });
    expect(report.summary.failed).toBeGreaterThan(0);
  });

  it('emits a JSON document on --format json', async () => {
    const captured: unknown[] = [];
    await runToolsLint({
      inlineSources: [{ file: 'src/tools/p.ts', source: PLACEHOLDER_DESC }],
      threshold: 60,
      format: 'json',
      jsonPrint: (payload) => captured.push(payload),
    });
    expect(captured).toHaveLength(1);
    const report = captured[0] as { summary: { totalTools: number }; tools: unknown[] };
    expect(report.summary.totalTools).toBe(1);
    expect(report.tools).toHaveLength(1);
  });

  it('passes every project when --threshold 0 is supplied', async () => {
    const before = process.exitCode;
    process.exitCode = 0;
    const report = await runToolsLint({
      inlineSources: [{ file: 'src/tools/p.ts', source: PLACEHOLDER_DESC }],
      threshold: 0,
      print: () => undefined,
    });
    expect(report.summary.failed).toBe(0);
    process.exitCode = before;
  });
});

describe('S-22/11 - globstar matches zero directory segments', () => {
  async function flatAndNestedFixture(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-glob-'));
    await mkdir(join(dir, 'src', 'nested'), { recursive: true });
    await writeFile(join(dir, 'src', 'flat-tool.ts'), NO_EXAMPLES, 'utf8');
    await writeFile(join(dir, 'src', 'nested', 'nested-tool.ts'), WELL_DESCRIBED, 'utf8');
    return dir;
  }

  it("the default glob 'src/**/*.{ts,tsx}' discovers a tool directly in src/", async () => {
    const dir = await flatAndNestedFixture();
    const report = await runToolsLint({ cwd: dir, threshold: 0, print: () => undefined });
    // The old translation required at least one directory level after
    // src/, silently skipping the flat sibling.
    expect(report.summary.totalTools).toBe(2);
    expect(report.tools.some((t) => t.source.includes('flat-tool.ts'))).toBe(true);
    expect(report.tools.some((t) => t.source.includes('nested-tool.ts'))).toBe(true);
  });

  it("a trailing '/**' matches the directory contents at every depth", async () => {
    const dir = await flatAndNestedFixture();
    const report = await runToolsLint({
      cwd: dir,
      source: 'src/**',
      threshold: 0,
      print: () => undefined,
    });
    expect(report.summary.totalTools).toBe(2);
  });
});

describe('S-22/10 - exit-2 contract for --config and walker failures', () => {
  function stubExit(): { calls: number[]; restore: () => void } {
    const calls: number[] = [];
    const spy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      calls.push(code ?? 0);
      throw new Error('exit-called');
    }) as never);
    return { calls, restore: () => spy.mockRestore() };
  }

  it('a missing --config exits 2 with a clear message (no silent default-glob fallback)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-cfg-'));
    const { calls, restore } = stubExit();
    const lines: string[] = [];
    try {
      await expect(
        runToolsLint({ cwd: dir, config: 'no-such-tsconfig.json', print: (l) => lines.push(l) }),
      ).rejects.toThrow('exit-called');
      expect(calls).toEqual([2]);
      expect(lines.some((l) => l.includes('cannot read --config'))).toBe(true);
    } finally {
      restore();
    }
  });

  it('an unparseable --config exits 2 with a clear message', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-cfg-'));
    await writeFile(join(dir, 'tsconfig.json'), '{ "include": ["src/**/*.ts"', 'utf8');
    const { calls, restore } = stubExit();
    const lines: string[] = [];
    try {
      await expect(
        runToolsLint({ cwd: dir, config: 'tsconfig.json', print: (l) => lines.push(l) }),
      ).rejects.toThrow('exit-called');
      expect(calls).toEqual([2]);
      expect(lines.some((l) => l.includes('is not valid JSON'))).toBe(true);
    } finally {
      restore();
    }
  });

  it('a --config without include[0] exits 2 instead of silently scanning the default glob', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-cfg-'));
    await writeFile(join(dir, 'tsconfig.json'), '{ "compilerOptions": {} }', 'utf8');
    const { calls, restore } = stubExit();
    try {
      await expect(
        runToolsLint({ cwd: dir, config: 'tsconfig.json', print: () => undefined }),
      ).rejects.toThrow('exit-called');
      expect(calls).toEqual([2]);
    } finally {
      restore();
    }
  });

  it('a walker/compileGlob failure exits 2, not 1', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-cfg-'));
    const { calls, restore } = stubExit();
    try {
      await expect(
        runToolsLint({ cwd: dir, source: 'a'.repeat(5000), print: () => undefined }),
      ).rejects.toThrow('exit-called');
      expect(calls).toEqual([2]);
    } finally {
      restore();
    }
  });

  it('a commented tsconfig with a globstar include is honoured (string-aware comment stripping)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-lint-cfg-'));
    await mkdir(join(dir, 'lib', 'tools'), { recursive: true });
    await writeFile(join(dir, 'lib', 'tools', 'tool.ts'), WELL_DESCRIBED, 'utf8');
    // The old regex stripper matched the `/**/` inside the include
    // STRING as a block comment, mangling 'lib/**/*.ts' into 'lib*.ts'
    // (0 files scanned, exit 0).
    await writeFile(
      join(dir, 'tsconfig.json'),
      [
        '/* canonical tsconfig */',
        '{',
        '  // include drives the scan',
        '  "include": ["lib/**/*.ts"]',
        '}',
      ].join('\n'),
      'utf8',
    );
    const report = await runToolsLint({
      cwd: dir,
      config: 'tsconfig.json',
      threshold: 0,
      print: () => undefined,
    });
    expect(report.summary.totalTools).toBe(1);
    expect(report.tools[0]?.source).toContain(join('lib', 'tools', 'tool.ts'));
  });
});
