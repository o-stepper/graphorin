import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import { createToolSearchTool } from '../src/built-in/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

function makeDeferred(name: string, description: string) {
  return tool({
    name,
    description,
    inputSchema: z.object({ q: z.string() }),
    sideEffectClass: 'read-only',
    defer_loading: true,
    async execute() {
      return { ok: true };
    },
  });
}

describe('tool_search', () => {
  it('finds deferred tools via the BM25 fallback', async () => {
    const registry = createToolRegistry();
    registry.register(
      makeDeferred('search_issues', 'Search the project tracker for issues matching a query.'),
      { kind: 'mcp', serverIdentity: 'linear' },
    );
    registry.register(makeDeferred('list_repos', 'List code repositories owned by the user.'), {
      kind: 'mcp',
      serverIdentity: 'github',
    });
    registry.register(
      makeDeferred('send_message', 'Send a chat message to a channel on the team messenger.'),
      { kind: 'mcp', serverIdentity: 'chat' },
    );
    const search = createToolSearchTool({ registry });
    const ctx = {
      toolCallId: 't',
      runContext: makeRunContext(),
      signal: new AbortController().signal,
      tracer: {
        startSpan() {
          return {
            type: 'tool.execute',
            id: 'span',
            traceId: 'trace',
            setAttributes() {},
            addEvent() {},
            recordException() {},
            setStatus() {},
            end() {},
          };
        },
        async span(_spec: unknown, fn: (s: unknown) => unknown) {
          return await fn({});
        },
        async flush() {},
        async shutdown() {},
      },
      logger: {
        trace() {},
        debug() {},
        info() {},
        warn() {},
        error() {},
        child() {
          return this;
        },
      },
      secrets: {
        async require() {
          throw new Error('not implemented in fixture');
        },
      },
      reportProgress() {},
      streamContent() {},
    } as never;
    const result = await search.execute({ query: 'issue tracker', k: 3 }, ctx);
    if (result === null || result === undefined) {
      throw new Error('expected matches');
    }
    const out = (result as { matches: { name: string }[] }).matches;
    expect(out.length).toBeGreaterThan(0);
    // Verify search_issues is found
    expect(out.some((m) => m.name === 'search_issues')).toBe(true);
  });

  it('returns no matches when there are no deferred tools', async () => {
    const registry = createToolRegistry();
    const search = createToolSearchTool({ registry });
    const ctx = {
      toolCallId: 't',
      runContext: makeRunContext(),
      signal: new AbortController().signal,
      tracer: {
        startSpan() {
          return {
            type: 'tool.execute',
            id: 's',
            traceId: 't',
            setAttributes() {},
            addEvent() {},
            recordException() {},
            setStatus() {},
            end() {},
          };
        },
        async span(_s: unknown, fn: (x: unknown) => unknown) {
          return await fn({});
        },
        async flush() {},
        async shutdown() {},
      },
      logger: {
        trace() {},
        debug() {},
        info() {},
        warn() {},
        error() {},
        child() {
          return this;
        },
      },
      secrets: {
        async require() {
          throw new Error('na');
        },
      },
      reportProgress() {},
      streamContent() {},
    } as never;
    const result = await search.execute({ query: 'anything' }, ctx);
    if (result === null || result === undefined) throw new Error('expected matches');
    expect((result as { matches: unknown[] }).matches).toHaveLength(0);
  });
});
