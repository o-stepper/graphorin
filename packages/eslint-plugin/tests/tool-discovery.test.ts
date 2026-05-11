import { describe, expect, it } from 'vitest';

import { discoverToolCallsInSource, gradeTool, runToolRules } from '../src/tool-discovery.js';

const SOURCE = `
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const a = tool({
  name: 'search_issues',
  description: 'Search the ticket tracker for open issues. Use when the user references a ticket or sprint by id.',
  inputSchema: z.object({
    query: z.string(),
  }),
  examples: [
    { input: { query: 'API outage' }, output: { issues: [{ id: 'ENG-42', title: 'API outage Tuesday' }] } },
    { input: { query: 'permissions bug' }, output: { issues: [{ id: 'ENG-99', title: 'Permissions bug' }] } },
  ],
  execute: async () => ({ issues: [] }),
});

export const b = tool({
  name: 'placeholder',
  description: 'TODO',
  inputSchema: z.object({ user: z.string(), id: z.string() }),
  execute: async () => undefined,
});
`;

describe('discoverToolCallsInSource', () => {
  it('finds two tool registrations', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(['search_issues', 'placeholder']);
  });

  it('extracts the description, examples count, and parameter names', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    const a = tools[0];
    if (a === undefined) throw new Error('expected tool a');
    expect(a.description).toContain('Search the ticket tracker');
    expect(a.examplesCount).toBe(2);
    expect(a.parameterNames).toEqual(['query']);
  });
});

describe('runToolRules', () => {
  it('flags placeholder description, missing examples, and ambiguous params', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    const placeholder = tools[1];
    if (placeholder === undefined) throw new Error('expected placeholder tool');
    const findings = runToolRules(placeholder);
    const rules = findings.map((f) => f.rule);
    expect(rules).toContain('graphorin/tool-description-required');
    expect(rules).toContain('graphorin/tool-examples-recommended');
    expect(rules).toContain('graphorin/tool-parameter-naming');
  });

  it('produces no findings for a well-described tool', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    const a = tools[0];
    if (a === undefined) throw new Error('expected tool a');
    const findings = runToolRules(a);
    expect(findings).toHaveLength(0);
  });
});

describe('gradeTool', () => {
  it('scores the well-described tool above 60', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    const a = tools[0];
    if (a === undefined) throw new Error('expected tool a');
    const score = gradeTool(a, runToolRules(a));
    expect(score.score).toBeGreaterThanOrEqual(60);
  });

  it('scores the placeholder tool below 60', () => {
    const tools = discoverToolCallsInSource('test.ts', SOURCE);
    const placeholder = tools[1];
    if (placeholder === undefined) throw new Error('expected placeholder tool');
    const score = gradeTool(placeholder, runToolRules(placeholder));
    expect(score.score).toBeLessThan(60);
  });
});
