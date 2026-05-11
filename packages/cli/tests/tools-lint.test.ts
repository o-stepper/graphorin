import { describe, expect, it } from 'vitest';

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
