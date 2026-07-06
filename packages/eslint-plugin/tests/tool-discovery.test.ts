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

describe('W-044 - comment-awareness', () => {
  it('a commented-out tool({...}) is not discovered (both comment kinds)', () => {
    const src = `
// export const dead = tool({
//   name: 'dead_tool',
//   description: 'this is commented out entirely and must not be graded',
// });
/*
export const alsoDead = tool({
  name: 'also_dead',
  description: 'block-commented tool, equally invisible',
});
*/
export const live = tool({
  name: 'live_tool',
  description: 'a real, uncommented registration that must be found normally',
  inputSchema: z.object({ queryText: z.string() }),
});
`;
    const tools = discoverToolCallsInSource('mixed.ts', src);
    expect(tools.map((t) => t.name)).toEqual(['live_tool']);
  });

  it("a 'tool(' inside a string literal is not discovered (blanker leaves strings intact)", () => {
    const src = `
const doc = "call tool({ name: 'fake' }) to register";
const tpl = \`tool({ name: 'also-fake' })\`;
`;
    expect(discoverToolCallsInSource('strings.ts', src)).toEqual([]);
  });

  it('a commented-out description inside a LIVE literal does not count', () => {
    const src = `
export const t = tool({
  name: 'partial_tool',
  // description: 'this line is commented out and must not be extracted',
  inputSchema: z.object({ queryText: z.string() }),
});
`;
    const [toolInfo] = discoverToolCallsInSource('partial.ts', src);
    if (toolInfo === undefined) throw new Error('not discovered');
    expect(toolInfo.description).toBeUndefined();
  });

  it('a commented email inside a live examples block does not penalize the axis; source stays original', () => {
    const src = `
export const t = tool({
  name: 'mail_tool',
  description: 'Send a transactional notification email through the configured gateway service.',
  inputSchema: z.object({ recipientEmail: z.string() }),
  examples: [
    // was: { input: { recipientEmail: 'real.person@gmail.com' } },
    { input: { recipientTag: 'primary-contact' }, output: { ok: true } },
  ],
});
`;
    const [toolInfo] = discoverToolCallsInSource('mail.ts', src);
    if (toolInfo === undefined) throw new Error('not discovered');
    const findings = runToolRules(toolInfo);
    expect(findings.filter((f) => f.kind === 'examples-pii-detected')).toEqual([]);
    // The report blob keeps the ORIGINAL text, comment included.
    expect(toolInfo.source).toContain('real.person@gmail.com');
    expect(toolInfo.gradingSource).not.toContain('real.person@gmail.com');
  });

  it('regex literals are conservatively preserved (a // inside one is not a comment)', () => {
    const src = `
const splitter = /[/]{2}/;
export const t = tool({
  name: 'regex_neighbor',
  description: 'A registration that follows a regex literal containing double slashes.',
  inputSchema: z.object({ queryText: z.string() }),
});
`;
    const tools = discoverToolCallsInSource('regex.ts', src);
    expect(tools.map((t) => t.name)).toEqual(['regex_neighbor']);
  });
});
