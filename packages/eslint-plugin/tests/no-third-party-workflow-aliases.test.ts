import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

const WORKFLOW_PATH = '/repo/packages/workflow/src/runtime.js';
const OTHER_PATH = '/repo/packages/agent/src/runtime.js';

describe('@graphorin/no-third-party-workflow-aliases', () => {
  it('flags forbidden third-party identifiers in workflow source', () => {
    const messages = lintSource({
      source: `
        const a = Send;
        const x = new Command();
        const y = interrupt(value);
      `,
      rule: 'no-third-party-workflow-aliases',
      filename: WORKFLOW_PATH,
    });
    expect(messages.length).toBeGreaterThanOrEqual(3);
    const forbidden = new Set(messages.map((m) => /'(\w+)'/.exec(m.message)?.[1]).filter(Boolean));
    expect(forbidden.has('Send')).toBe(true);
    expect(forbidden.has('Command')).toBe(true);
    expect(forbidden.has('interrupt')).toBe(true);
  });

  it('flags LastValue / Topic / BinaryAggregate', () => {
    const messages = lintSource({
      source: `
        const channel = LastValue;
        const t = Topic;
        const agg = BinaryAggregate;
      `,
      rule: 'no-third-party-workflow-aliases',
      filename: WORKFLOW_PATH,
    });
    expect(messages.length).toBeGreaterThanOrEqual(3);
  });

  it('does NOT flag when the source is outside the workflow package', () => {
    const messages = lintSource({
      source: `const x = new Command();`,
      rule: 'no-third-party-workflow-aliases',
      filename: OTHER_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('respects the graphorin-workflow-naming-allow opt-out comment', () => {
    const messages = lintSource({
      source: `
        // graphorin-workflow-naming-allow: external integration with vendor library
        const x = new Command();
      `,
      rule: 'no-third-party-workflow-aliases',
      filename: WORKFLOW_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('ignores import specifiers (vendor identifiers may need to be referenced)', () => {
    const messages = lintSource({
      source: `import { Send } from 'some-vendor-pkg';`,
      rule: 'no-third-party-workflow-aliases',
      filename: WORKFLOW_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('does NOT flag the canonical Graphorin primitive names', () => {
    const messages = lintSource({
      source: `
        const d = new Directive();
        const dispatch = Dispatch();
        const lv = new LatestValue();
        const r = new Reducer();
        const s = new Stream();
      `,
      rule: 'no-third-party-workflow-aliases',
      filename: WORKFLOW_PATH,
    });
    expect(messages).toEqual([]);
  });
});
