import { describe, expect, it } from 'vitest';

import { AgentRegistry, WorkflowRegistry } from '../src/registry/index.js';

describe('AgentRegistry', () => {
  it('registers and looks up agents', () => {
    const reg = new AgentRegistry();
    const agent = {
      id: 'echo',
      async run(input: unknown) {
        return input;
      },
    };
    reg.register({ id: agent.id, agent, description: 'echo agent', tags: ['demo'] });
    expect(reg.has('echo')).toBe(true);
    expect(reg.get('echo')).toBe(agent);
    expect(reg.size()).toBe(1);
    expect(reg.list()).toEqual([{ id: 'echo', description: 'echo agent', tags: ['demo'] }]);
    expect(reg.describe('echo')).toEqual({ id: 'echo', description: 'echo agent', tags: ['demo'] });
  });

  it('returns undefined for unknown ids', () => {
    const reg = new AgentRegistry();
    expect(reg.get('missing')).toBeUndefined();
    expect(reg.describe('missing')).toBeUndefined();
  });

  it('replaces an entry on duplicate id', () => {
    const reg = new AgentRegistry();
    const a = {
      id: 'x',
      async run() {
        return 1;
      },
    };
    const b = {
      id: 'x',
      async run() {
        return 2;
      },
    };
    reg.register({ id: 'x', agent: a });
    reg.register({ id: 'x', agent: b });
    expect(reg.size()).toBe(1);
    expect(reg.get('x')).toBe(b);
  });

  it('unregisters entries', () => {
    const reg = new AgentRegistry();
    reg.register({
      id: 'x',
      agent: {
        id: 'x',
        async run() {
          return 1;
        },
      },
    });
    expect(reg.unregister('x')).toBe(true);
    expect(reg.unregister('x')).toBe(false);
    expect(reg.size()).toBe(0);
  });
});

describe('WorkflowRegistry', () => {
  it('lists and describes workflows', () => {
    const reg = new WorkflowRegistry();
    const wf = {
      name: 'pipeline',
      execute(): AsyncIterable<unknown> {
        return (async function* () {})();
      },
    };
    reg.register({ id: 'pipeline', workflow: wf, tags: ['etl'] });
    expect(reg.has('pipeline')).toBe(true);
    expect(reg.get('pipeline')).toBe(wf);
    expect(reg.describe('pipeline')).toEqual({ id: 'pipeline', tags: ['etl'] });
    expect(reg.list()).toEqual([{ id: 'pipeline', tags: ['etl'] }]);
  });
});
