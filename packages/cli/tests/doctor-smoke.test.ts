/**
 * `graphorin doctor --smoke-local` (external audit 2026-07-16, item 6).
 * The SQLite legs run against the REAL store in a throwaway dir; the
 * Ollama legs run against an injected fetch stub.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runDoctor } from '../src/commands/doctor.js';
import { runLocalSmoke } from '../src/internal/smoke-local.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graphorin-doctor-smoke-test-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function byCheck(checks: ReadonlyArray<{ check: string; status: string; message: string }>) {
  return new Map(checks.map((c) => [c.check, c]));
}

const unreachableFetch: typeof fetch = async () => {
  throw new Error('ECONNREFUSED');
};

function ndjson(lines: ReadonlyArray<object>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(enc.encode(`${JSON.stringify(line)}\n`));
      controller.close();
    },
  });
}

/** A stubbed local Ollama daemon: version, tags, embed, streaming chat. */
function stubOllamaFetch(args: { models: string[]; toolCall?: boolean }): typeof fetch {
  return (async (input: unknown) => {
    const url = String(input);
    if (url.endsWith('/api/version')) {
      return new Response(JSON.stringify({ version: '0.13.5' }), { status: 200 });
    }
    if (url.endsWith('/api/tags')) {
      return new Response(JSON.stringify({ models: args.models.map((name) => ({ name })) }), {
        status: 200,
      });
    }
    if (url.endsWith('/api/embed')) {
      return new Response(JSON.stringify({ embeddings: [new Array(768).fill(0.1)] }), {
        status: 200,
      });
    }
    if (url.endsWith('/api/chat')) {
      return new Response(
        ndjson([
          { message: { role: 'assistant', content: '' } },
          ...(args.toolCall !== false
            ? [
                {
                  message: {
                    tool_calls: [{ function: { name: 'add', arguments: { a: 2, b: 3 } } }],
                  },
                },
              ]
            : [{ message: { content: '5' } }]),
          {
            done: true,
            done_reason: 'stop',
            prompt_eval_count: 30,
            eval_count: 12,
            total_duration: 900_000_000,
            load_duration: 50_000_000,
            prompt_eval_duration: 200_000_000,
            eval_duration: 600_000_000,
          },
        ]),
        { status: 200 },
      );
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
}

describe('runLocalSmoke - SQLite legs (real store)', () => {
  it('native + write/reopen/search pass; unreachable Ollama degrades to warn + skips', async () => {
    const checks = byCheck(await runLocalSmoke({ smokeDir: dir, fetchImpl: unreachableFetch }));
    expect(checks.get('smoke:native')?.status).toBe('ok');
    expect(checks.get('smoke:sqlite-roundtrip')?.status).toBe('ok');
    expect(checks.get('smoke:ollama')?.status).toBe('warn');
    expect(checks.get('smoke:ollama-models')?.status).toBe('skip');
    expect(checks.get('smoke:embedding')?.status).toBe('skip');
    expect(checks.get('smoke:chat')?.status).toBe('skip');
  });
});

describe('runLocalSmoke - Ollama legs (stubbed daemon)', () => {
  it('full pass: reachability, model presence, embedding dimension, streamed tool call + timings', async () => {
    const checks = byCheck(
      await runLocalSmoke({
        smokeDir: dir,
        fetchImpl: stubOllamaFetch({ models: ['qwen3:8b-q4_K_M', 'nomic-embed-text:latest'] }),
        ollamaModel: 'qwen3:8b-q4_K_M',
      }),
    );
    expect(checks.get('smoke:ollama')?.status).toBe('ok');
    expect(checks.get('smoke:ollama')?.message).toContain('0.13.5');
    expect(checks.get('smoke:ollama-models')?.status).toBe('ok');
    expect(checks.get('smoke:embedding')?.status).toBe('ok');
    expect(checks.get('smoke:embedding')?.message).toContain('dimension 768');
    expect(checks.get('smoke:chat')?.status).toBe('ok');
    expect(checks.get('smoke:chat')?.message).toContain('tool call');
    expect(checks.get('smoke:chat')?.message).toContain('gen 600ms');
  });

  it('a missing requested model fails the inventory check and skips the chat leg', async () => {
    const checks = byCheck(
      await runLocalSmoke({
        smokeDir: dir,
        fetchImpl: stubOllamaFetch({ models: ['nomic-embed-text:latest'] }),
        ollamaModel: 'qwen3:8b-q4_K_M',
      }),
    );
    expect(checks.get('smoke:ollama-models')?.status).toBe('fail');
    expect(checks.get('smoke:chat')?.status).toBe('skip');
  });

  it('without --ollama-model the chat leg is skipped with a hint', async () => {
    const checks = byCheck(
      await runLocalSmoke({
        smokeDir: dir,
        fetchImpl: stubOllamaFetch({ models: ['nomic-embed-text:latest'] }),
      }),
    );
    expect(checks.get('smoke:ollama-models')?.status).toBe('ok');
    expect(checks.get('smoke:chat')?.status).toBe('skip');
  });

  it('a model that streams without calling the tool degrades the chat leg to warn', async () => {
    const checks = byCheck(
      await runLocalSmoke({
        smokeDir: dir,
        fetchImpl: stubOllamaFetch({ models: ['tinyllama:latest'], toolCall: false }),
        ollamaModel: 'tinyllama',
      }),
    );
    expect(checks.get('smoke:chat')?.status).toBe('warn');
  });
});

describe('runDoctor --smoke-local integration', () => {
  it('smoke-only selection: host checks stay off, smoke results land in the report', async () => {
    const report = await runDoctor({
      smokeLocal: true,
      smokeDir: dir,
      smokeFetchImpl: unreachableFetch,
      home: dir,
      json: true,
      print: () => {},
    });
    const names = report.checks.map((c) => c.check);
    expect(names).toContain('smoke:native');
    expect(names).toContain('smoke:sqlite-roundtrip');
    expect(names.every((n) => n.startsWith('smoke:'))).toBe(true);
    expect(report.summary.fail).toBe(0);
  });
});
