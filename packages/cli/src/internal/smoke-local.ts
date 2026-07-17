/**
 * `graphorin doctor --smoke-local` - the local-first first-run smoke
 * (external audit 2026-07-16, item 6). Exercises the exact stack a new
 * local deployment depends on, through the same code paths consumers
 * use:
 *
 * 1. `smoke:native` - the native SQLite stack loads (`better-sqlite3`
 *    binding + the `sqlite-vec` extension). A pnpm-10 skipped-build
 *    install surfaces here as the actionable
 *    `SqliteNativeBindingError` hint instead of a runtime stack later.
 * 2. `smoke:sqlite-roundtrip` - write / close / reopen / search
 *    against a throwaway store (FTS recall; no embedding model
 *    needed).
 * 3. `smoke:ollama` - daemon reachability (`/api/version`).
 * 4. `smoke:ollama-models` - installed models (`/api/tags`); with
 *    `--ollama-model` the named model must be present.
 * 5. `smoke:embedding` - one real `/api/embed` call, reporting the
 *    embedding dimension (skipped when the embed model is not
 *    installed).
 * 6. `smoke:chat` - a streamed tool-call round-trip through the real
 *    `ollamaAdapter` (`think: false`), reporting the server-side
 *    load / prompt-eval / generation timings. Runs only when
 *    `--ollama-model` names a model.
 *
 * A missing Ollama daemon degrades to `warn` + `skip` (the SQLite legs
 * still run); it never hard-fails a machine that only wanted the
 * storage checks.
 *
 * @packageDocumentation
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createMemory } from '@graphorin/memory';
import { DEFAULT_OLLAMA_BASE_URL, ollamaAdapter } from '@graphorin/provider';
import type { CheckResult } from '@graphorin/security';
import { createSqliteStore } from '@graphorin/store-sqlite';

/**
 * Options for {@link runLocalSmoke}.
 *
 * @stable
 */
export interface LocalSmokeOptions {
  /** Ollama daemon base URL. Default `http://127.0.0.1:11434`. */
  readonly ollamaBaseUrl?: string;
  /**
   * Chat model to exercise with the streamed tool-call leg. Without it
   * the chat leg is skipped (model inventory is still reported).
   */
  readonly ollamaModel?: string;
  /** Embedding model for the dimension probe. Default `nomic-embed-text`. */
  readonly embedModel?: string;
  /** Wall-clock bound for the chat leg. Default 60s. */
  readonly chatTimeoutMs?: number;
  /** Test seam - injected fetch for every Ollama call. */
  readonly fetchImpl?: typeof fetch;
  /** Test seam - directory for the throwaway store (default mkdtemp). */
  readonly smokeDir?: string;
}

/**
 * Run the local-stack smoke and return doctor-shaped check results.
 *
 * @stable
 */
export async function runLocalSmoke(options: LocalSmokeOptions = {}): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];
  await sqliteLegs(options, checks);
  await ollamaLegs(options, checks);
  return checks;
}

async function sqliteLegs(options: LocalSmokeOptions, checks: CheckResult[]): Promise<void> {
  const dir = options.smokeDir ?? (await mkdtemp(join(tmpdir(), 'graphorin-doctor-smoke-')));
  const dbPath = join(dir, 'smoke.db');
  let vecLoaded = true;
  try {
    let store: Awaited<ReturnType<typeof createSqliteStore>>;
    try {
      store = await createSqliteStore({ path: dbPath });
      await store.init();
    } catch (err) {
      const name = (err as Error).name;
      if (name === 'SqliteNativeBindingError') {
        checks.push({
          check: 'smoke:native',
          status: 'fail',
          message: 'better-sqlite3 is installed but its native binding did not load',
          hint: (err as Error).message,
        });
        return;
      }
      if (name === 'SqliteVecMissingError') {
        vecLoaded = false;
        checks.push({
          check: 'smoke:native',
          status: 'warn',
          message: 'better-sqlite3 loaded; sqlite-vec is unavailable (vector search disabled)',
          hint: 'Install the sqlite-vec peer for indexed KNN; FTS keyword recall still works.',
        });
        store = await createSqliteStore({ path: dbPath, skipSqliteVec: true });
        await store.init();
      } else {
        checks.push({
          check: 'smoke:native',
          status: 'fail',
          message: `store open failed: ${(err as Error).message}`,
        });
        return;
      }
    }
    if (vecLoaded) {
      checks.push({
        check: 'smoke:native',
        status: 'ok',
        message: 'better-sqlite3 binding + sqlite-vec extension loaded',
      });
    }

    // Write, CLOSE, reopen from disk, search - the persistence contract
    // a first-run assistant depends on. No embedder: FTS-only recall.
    try {
      const scope = { userId: 'doctor-smoke' };
      const memoryA = createMemory({
        store: store.memory,
        embeddings: store.embeddings,
        contextEngine: { compaction: false },
      });
      await memoryA.semantic.remember(scope, { text: 'Doctor smoke: quiet parks and coffee.' });
      await store.close();

      const reopened = await createSqliteStore({
        path: dbPath,
        ...(vecLoaded ? {} : { skipSqliteVec: true }),
      });
      await reopened.init();
      const memoryB = createMemory({
        store: reopened.memory,
        embeddings: reopened.embeddings,
        contextEngine: { compaction: false },
      });
      const hits = await memoryB.semantic.search(scope, 'quiet parks coffee');
      await reopened.close();
      const found = hits.some((h) => h.record.text.includes('quiet parks'));
      checks.push(
        found
          ? {
              check: 'smoke:sqlite-roundtrip',
              status: 'ok',
              message: 'write / reopen / search round-trip recalled the fact (FTS)',
            }
          : {
              check: 'smoke:sqlite-roundtrip',
              status: 'fail',
              message: `reopened store did not recall the written fact (${hits.length} hit(s))`,
            },
      );
    } catch (err) {
      checks.push({
        check: 'smoke:sqlite-roundtrip',
        status: 'fail',
        message: `round-trip failed: ${(err as Error).message}`,
      });
    }
  } finally {
    if (options.smokeDir === undefined) {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

async function ollamaLegs(options: LocalSmokeOptions, checks: CheckResult[]): Promise<void> {
  const baseUrl = (options.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const skipDependents = (reason: string): void => {
    checks.push(
      { check: 'smoke:ollama-models', status: 'skip', message: reason },
      { check: 'smoke:embedding', status: 'skip', message: reason },
      { check: 'smoke:chat', status: 'skip', message: reason },
    );
  };

  let version: string;
  try {
    const resp = await fetchImpl(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    version = String(((await resp.json()) as { version?: string }).version ?? 'unknown');
  } catch {
    checks.push({
      check: 'smoke:ollama',
      status: 'warn',
      message: `Ollama is not reachable at ${baseUrl}`,
      hint: 'Install and start Ollama (https://ollama.com) or pass --ollama-base-url; the local-LLM legs were skipped.',
    });
    skipDependents('Ollama unreachable');
    return;
  }
  checks.push({
    check: 'smoke:ollama',
    status: 'ok',
    message: `daemon reachable at ${baseUrl} (version ${version})`,
  });

  let installed: string[] = [];
  try {
    const resp = await fetchImpl(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = (await resp.json()) as { models?: ReadonlyArray<{ name?: string }> };
    installed = (json.models ?? []).map((m) => m.name ?? '').filter((n) => n.length > 0);
  } catch (err) {
    checks.push({
      check: 'smoke:ollama-models',
      status: 'fail',
      message: `/api/tags failed: ${(err as Error).message}`,
    });
    return;
  }

  if (options.ollamaModel !== undefined) {
    const present = installed.some(
      (name) => name === options.ollamaModel || name.startsWith(`${options.ollamaModel}:`),
    );
    checks.push(
      present
        ? {
            check: 'smoke:ollama-models',
            status: 'ok',
            message: `'${options.ollamaModel}' is installed (${installed.length} model(s) total)`,
          }
        : {
            check: 'smoke:ollama-models',
            status: 'fail',
            message: `'${options.ollamaModel}' is not installed`,
            hint: `Run: ollama pull ${options.ollamaModel}`,
          },
    );
    if (!present) {
      checks.push({ check: 'smoke:chat', status: 'skip', message: 'chat model not installed' });
    }
  } else {
    checks.push(
      installed.length > 0
        ? {
            check: 'smoke:ollama-models',
            status: 'ok',
            message: `${installed.length} model(s) installed`,
          }
        : {
            check: 'smoke:ollama-models',
            status: 'warn',
            message: 'no models installed',
            hint: 'Pull a chat model (e.g. ollama pull qwen3:8b-q4_K_M) and an embedder (ollama pull nomic-embed-text).',
          },
    );
  }

  const embedModel = options.embedModel ?? 'nomic-embed-text';
  const embedInstalled = installed.some(
    (name) => name === embedModel || name.startsWith(`${embedModel}:`),
  );
  if (!embedInstalled) {
    checks.push({
      check: 'smoke:embedding',
      status: 'skip',
      message: `embed model '${embedModel}' is not installed`,
      hint: `Run: ollama pull ${embedModel} (or pass --embed-model)`,
    });
  } else {
    try {
      const resp = await fetchImpl(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: embedModel, input: 'graphorin doctor embedding probe' }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as { embeddings?: ReadonlyArray<ReadonlyArray<number>> };
      const dimension = json.embeddings?.[0]?.length ?? 0;
      checks.push(
        dimension > 0
          ? {
              check: 'smoke:embedding',
              status: 'ok',
              message: `'${embedModel}' embeds (dimension ${dimension})`,
            }
          : {
              check: 'smoke:embedding',
              status: 'fail',
              message: `'${embedModel}' returned no embedding vector`,
            },
      );
    } catch (err) {
      checks.push({
        check: 'smoke:embedding',
        status: 'fail',
        message: `/api/embed failed: ${(err as Error).message}`,
      });
    }
  }

  if (options.ollamaModel === undefined) {
    checks.push({
      check: 'smoke:chat',
      status: 'skip',
      message: 'no chat model selected',
      hint: 'Pass --ollama-model <name> to exercise streaming + tool calls end to end.',
    });
    return;
  }
  if (
    !installed.some(
      (name) => name === options.ollamaModel || name.startsWith(`${options.ollamaModel}:`),
    )
  ) {
    return; // skip already recorded above
  }
  await chatLeg(options, baseUrl, checks);
}

async function chatLeg(
  options: LocalSmokeOptions,
  baseUrl: string,
  checks: CheckResult[],
): Promise<void> {
  const timeoutMs = options.chatTimeoutMs ?? 60_000;
  try {
    const provider = ollamaAdapter({
      model: options.ollamaModel as string,
      baseUrl,
      think: false,
      logger: () => {},
      ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
      timeoutMs,
    });
    let textDeltas = 0;
    let toolCalls = 0;
    let timings: Record<string, unknown> | undefined;
    let finishReason = 'unknown';
    const started = Date.now();
    for await (const event of provider.stream({
      messages: [
        {
          role: 'user',
          content: 'Call the add tool with a=2 and b=3, then answer with just the number.',
        },
      ],
      tools: [
        {
          name: 'add',
          description: 'Add two integers.',
          inputSchema: {
            type: 'object',
            properties: { a: { type: 'number' }, b: { type: 'number' } },
            required: ['a', 'b'],
          },
        },
      ],
      maxTokens: 200,
      signal: AbortSignal.timeout(timeoutMs),
    })) {
      if (event.type === 'text-delta') textDeltas += 1;
      if (event.type === 'tool-call-start') toolCalls += 1;
      if (event.type === 'finish') {
        finishReason = event.finishReason;
        timings = (event.providerMetadata?.ollama ?? undefined) as
          | Record<string, unknown>
          | undefined;
      }
    }
    const wallMs = Date.now() - started;
    const timing =
      timings !== undefined
        ? ` (load ${String(timings.loadMs ?? '?')}ms, prompt ${String(timings.promptEvalMs ?? '?')}ms, gen ${String(timings.evalMs ?? '?')}ms)`
        : '';
    const streamed = textDeltas + toolCalls > 0;
    if (!streamed) {
      checks.push({
        check: 'smoke:chat',
        status: 'fail',
        message: `no streamed output in ${wallMs}ms (finish: ${finishReason})`,
      });
    } else if (toolCalls === 0) {
      checks.push({
        check: 'smoke:chat',
        status: 'warn',
        message: `streamed in ${wallMs}ms${timing} but the model did not call the tool`,
        hint: 'Streaming works; tool-calling depends on the model. Try a tool-capable model (qwen3, llama3.1, ...).',
      });
    } else {
      checks.push({
        check: 'smoke:chat',
        status: 'ok',
        message: `streamed + tool call in ${wallMs}ms${timing}`,
      });
    }
  } catch (err) {
    checks.push({
      check: 'smoke:chat',
      status: 'fail',
      message: `chat leg failed: ${(err as Error).message}`,
    });
  }
}
