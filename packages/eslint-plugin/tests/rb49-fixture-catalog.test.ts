/**
 * RB-49 fixture catalog calibration tests. These fixtures are taken
 * verbatim from the RB-49 § Test fixture catalog and pin the per-tool
 * grader scores so future rubric changes surface as test diffs rather
 * than silent score drift.
 */

import { describe, expect, it } from 'vitest';

import { discoverToolCallsInSource, gradeTool, runToolRules } from '../src/tool-discovery.js';

const WELL_DESCRIBED = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const wellDescribedTool = tool({
  name: 'search_issues',
  description: 'Search the ticket tracker for open issues. Use when the user references a ticket or sprint by id.',
  inputSchema: z.object({
    query: z.string(),
  }),
  examples: [
    {
      input: { query: 'API outage' },
      output: { issues: [{ id: 'ENG-42', title: 'API outage Tuesday' }] },
      comment: 'Use for issue-tracker queries; not for PR queries.',
    },
  ],
});
`;

const PLACEHOLDER_DESCRIPTION = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const placeholderDescriptionTool = tool({
  name: 'do_thing',
  description: 'TBD',
  inputSchema: z.object({ arg1: z.string() }),
});
`;

const EXAMPLES_PII = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const examplesPiiTool = tool({
  name: 'send_email',
  description: 'Send an email to a recipient via the configured SMTP gateway. Use for transactional notices.',
  inputSchema: z.object({
    to: z.string(),
    body: z.string(),
  }),
  examples: [
    { input: { to: 'realuser@gmail.com', body: 'Hello' }, output: { messageId: 'msg-1' } },
  ],
});
`;

describe('RB-49 fixture catalog — calibrated scores', () => {
  it('wellDescribedTool scores 82', () => {
    const tools = discoverToolCallsInSource('src/tools/well.ts', WELL_DESCRIBED);
    expect(tools).toHaveLength(1);
    const tool = tools[0];
    if (tool === undefined) throw new Error('expected fixture tool');
    const score = gradeTool(tool, runToolRules(tool));
    expect(score.score).toBe(82);
    expect(score.axes.description).toBe(40);
    expect(score.axes.examples).toBe(12);
    expect(score.axes.parameterNaming).toBe(30);
    expect(score.findings).toHaveLength(0);
  });

  it('placeholderDescriptionTool scores 20', () => {
    const tools = discoverToolCallsInSource('src/tools/placeholder.ts', PLACEHOLDER_DESCRIPTION);
    expect(tools).toHaveLength(1);
    const tool = tools[0];
    if (tool === undefined) throw new Error('expected fixture tool');
    const findings = runToolRules(tool);
    const score = gradeTool(tool, findings);
    expect(score.score).toBe(20);
    expect(score.axes.description).toBe(0);
    expect(score.axes.examples).toBe(0);
    expect(score.axes.parameterNaming).toBe(20);
    const kinds = findings.map((f) => f.kind).sort();
    expect(kinds).toEqual([
      'description-placeholder',
      'examples-missing',
      'parameter-numeric-suffix',
    ]);
  });

  it('examplesPiiTool scores 61', () => {
    const tools = discoverToolCallsInSource('src/tools/email.ts', EXAMPLES_PII);
    expect(tools).toHaveLength(1);
    const tool = tools[0];
    if (tool === undefined) throw new Error('expected fixture tool');
    const findings = runToolRules(tool);
    const score = gradeTool(tool, findings);
    expect(score.score).toBe(61);
    expect(score.axes.description).toBe(40);
    expect(score.axes.examples).toBe(6);
    expect(score.axes.parameterNaming).toBe(15);
    const kinds = findings.map((f) => f.kind).sort();
    expect(kinds).toContain('examples-pii-detected');
    expect(kinds).toContain('parameter-ambiguous');
  });
});
