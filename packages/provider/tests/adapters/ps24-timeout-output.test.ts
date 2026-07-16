import type { ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { llamaCppServerAdapter } from '../../src/adapters/llamacpp-server.js';
import { ollamaAdapter } from '../../src/adapters/ollama.js';
import { ProviderHttpError } from '../../src/errors/errors.js';

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

const STRUCTURED_REQ: ProviderRequest = {
  ...REQ,
  outputType: {
    kind: 'structured',
    jsonSchema: {
      type: 'object',
      properties: { answer: { type: 'string' } },
      required: ['answer'],
    },
  },
};

function captureFetch(capture: { body?: unknown }): typeof fetch {
  return (async (_input: unknown, init?: RequestInit): Promise<Response> => {
    capture.body = JSON.parse(String(init?.body ?? '{}'));
    return new Response(JSON.stringify({ choices: [], message: { content: '' }, done: true }), {
      status: 200,
    });
  }) as typeof fetch;
}

function hangingFetch(): typeof fetch {
  return ((_input: unknown, init?: RequestInit): Promise<Response> =>
    new Promise<Response>((_resolve, reject) => {
      // Honour the abort signal like real fetch does - the timeout
      // must surface, not hang the test.
      init?.signal?.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    })) as typeof fetch;
}

describe('PS-24 - default request timeout', () => {
  it('llamacpp-server generate() times out against a hung server with a typed error', async () => {
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:8080',
      fetchImpl: hangingFetch(),
      timeoutMs: 25,
    });
    await expect(provider.generate(REQ)).rejects.toThrow(ProviderHttpError);
    await expect(
      llamaCppServerAdapter({
        model: 'qwen2.5',
        baseUrl: 'http://127.0.0.1:8080',
        fetchImpl: hangingFetch(),
        timeoutMs: 25,
      }).generate(REQ),
    ).rejects.toThrow(/timed out/);
  });

  it('ollama generate() times out against a hung server', async () => {
    const provider = ollamaAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:11434',
      fetchImpl: hangingFetch(),
      timeoutMs: 25,
    });
    await expect(provider.generate(REQ)).rejects.toThrow(/timed out/);
  });
});

describe('PS-24 - structured output plumbing', () => {
  it('openai-shaped path maps outputType.jsonSchema to response_format json_schema', async () => {
    const capture: { body?: unknown } = {};
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:8080',
      fetchImpl: captureFetch(capture),
    });
    await provider.generate(STRUCTURED_REQ);
    const body = capture.body as {
      response_format?: { type?: string; json_schema?: { schema?: unknown } };
    };
    expect(body.response_format?.type).toBe('json_schema');
    expect(body.response_format?.json_schema?.schema).toEqual(
      (STRUCTURED_REQ.outputType as { jsonSchema: unknown }).jsonSchema,
    );
  });

  it('LIVE-EVAL-01: schema-less structured output uses a permissive json_schema (not json_object)', async () => {
    const capture: { body?: unknown } = {};
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:8080',
      fetchImpl: captureFetch(capture),
    });
    await provider.generate({ ...REQ, outputType: { kind: 'structured' } });
    const body = capture.body as {
      response_format?: { type?: string; json_schema?: { schema?: unknown; strict?: boolean } };
    };
    // The Anthropic OpenAI-compat endpoint rejects json_object, so a schema-less
    // structured request now sends a permissive json_schema with strict:false.
    expect(body.response_format?.type).toBe('json_schema');
    expect(body.response_format?.json_schema?.strict).toBe(false);
    expect(body.response_format?.json_schema?.schema).toEqual({
      type: 'object',
      additionalProperties: true,
    });
  });

  it('ollama native path maps outputType.jsonSchema to the format field', async () => {
    const capture: { body?: unknown } = {};
    const provider = ollamaAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:11434',
      fetchImpl: captureFetch(capture),
    });
    await provider.generate(STRUCTURED_REQ);
    const body = capture.body as { format?: unknown };
    expect(body.format).toEqual((STRUCTURED_REQ.outputType as { jsonSchema: unknown }).jsonSchema);
  });

  it('a structuredOutput:false capability override gates the mapping off', async () => {
    const capture: { body?: unknown } = {};
    const provider = llamaCppServerAdapter({
      model: 'qwen2.5',
      baseUrl: 'http://127.0.0.1:8080',
      fetchImpl: captureFetch(capture),
      capabilities: { structuredOutput: false },
    });
    await provider.generate(STRUCTURED_REQ);
    const body = capture.body as { response_format?: unknown };
    expect(body.response_format).toBeUndefined();
  });
});
