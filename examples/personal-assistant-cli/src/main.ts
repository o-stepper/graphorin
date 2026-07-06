/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Single-agent local CLI personal assistant - library mode. The
 * module wires `createAgent({...})` to a six-tier `Memory` backed by
 * the SQLite store and the bundled transformers.js embedder, and
 * exposes four LLM recipes (`ollama`, `llamacpp-server`,
 * `llamacpp-node`, `stub`) selected through `GRAPHORIN_LLM_RECIPE`.
 * Reads user lines from stdin, streams `text.delta` events to stdout,
 * and unwinds cleanly through `agent.abort({...})` on `Ctrl+C`.
 */

import process from 'node:process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import type { Writable } from 'node:stream';
import { type Agent, createAgent } from '@graphorin/agent';
import type { AgentEvent, EmbedderProvider, Provider } from '@graphorin/core';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createMemory, defineBlock, type Memory } from '@graphorin/memory';
import { createProvider, llamaCppServerAdapter, ollamaAdapter } from '@graphorin/provider';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import { createStubProvider } from './stub-provider.js';

export const VERSION: string = pkg.version;

/** LLM recipes exposed by `GRAPHORIN_LLM_RECIPE`. */
export type Recipe = 'ollama' | 'llamacpp-server' | 'llamacpp-node' | 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['ollama', 'llamacpp-server', 'llamacpp-node', 'stub'];

/**
 * User-facing error type emitted when the operator opted into offline
 * mode but the chosen recipe needs a daemon that is not reachable.
 */
export class OfflineRecipeUnreachableError extends Error {
  override readonly name = 'OfflineRecipeUnreachableError';
  readonly recipe: Recipe;
  readonly endpoint: string;
  constructor(recipe: Recipe, endpoint: string, cause?: unknown) {
    super(
      `[graphorin/example-personal-assistant-cli] GRAPHORIN_OFFLINE=1 is set and recipe '${recipe}' ` +
        `cannot reach its local endpoint '${endpoint}'. Start the daemon (or unset GRAPHORIN_OFFLINE) and try again.`,
    );
    this.recipe = recipe;
    this.endpoint = endpoint;
    if (cause !== undefined) {
      (this as unknown as { cause?: unknown }).cause = cause;
    }
  }
}

/** Inputs accepted by {@link createAssistant}. */
export interface AssistantOptions {
  readonly recipe?: Recipe;
  readonly storePath?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly env?: NodeJS.ProcessEnv;
  /** Inject an embedder (defaults to transformers.js). */
  readonly embedder?: EmbedderProvider | null;
  /** Inject a `Provider` directly (bypasses the recipe selector). */
  readonly providerOverride?: Provider;
  /**
   * Override the reachability probe (used by the smoke test). Returns
   * `true` when the endpoint accepts a TCP/HTTP connection.
   */
  readonly reachabilityProbe?: (url: string) => Promise<boolean>;
}

/** Handle returned by {@link createAssistant}. */
export interface AssistantHandle {
  readonly agent: Agent<undefined, string>;
  readonly memory: Memory;
  readonly provider: Provider;
  readonly recipe: Recipe;
  readonly sessionId: string;
  readonly userId: string;
  readonly store: GraphorinSqliteStore;
  close(): Promise<void>;
}

/**
 * Resolve and validate the configured recipe. Falls back to `'ollama'`
 * when `GRAPHORIN_LLM_RECIPE` is unset (matching the README).
 */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'ollama').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-personal-assistant-cli] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
      `Pick one of ${ALL_RECIPES.join(', ')}.`,
  );
}

/** `true` when `GRAPHORIN_OFFLINE` is set to a truthy value. */
export function isOfflineMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.GRAPHORIN_OFFLINE;
  if (raw === undefined) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Build the configured `Provider`. Honours `GRAPHORIN_OFFLINE=1` for
 * the `'ollama'` recipe by probing the daemon URL before returning;
 * unreachable endpoints raise {@link OfflineRecipeUnreachableError}.
 */
export async function buildProvider(
  recipe: Recipe,
  options: {
    readonly env?: NodeJS.ProcessEnv;
    readonly reachabilityProbe?: (url: string) => Promise<boolean>;
  } = {},
): Promise<Provider> {
  const env = options.env ?? process.env;
  const probe = options.reachabilityProbe ?? defaultReachabilityProbe;

  if (recipe === 'stub') {
    return createProvider(createStubProvider(), { acceptsSensitivity: ['public', 'internal'] });
  }

  if (recipe === 'ollama') {
    const baseUrl = (env.GRAPHORIN_LLM_BASEURL ?? 'http://127.0.0.1:11434').trim();
    const model = (env.GRAPHORIN_LLM_MODEL ?? 'qwen2.5:7b-instruct-q4_K_M').trim();
    if (isOfflineMode(env)) {
      const reachable = await probe(baseUrl);
      if (!reachable) throw new OfflineRecipeUnreachableError('ollama', baseUrl);
    }
    return createProvider(ollamaAdapter({ baseUrl, model }), {
      acceptsSensitivity: ['public', 'internal'],
    });
  }

  if (recipe === 'llamacpp-server') {
    const baseUrl = (env.GRAPHORIN_LLM_BASEURL ?? 'http://127.0.0.1:8080').trim();
    const model = (env.GRAPHORIN_LLM_MODEL ?? 'llama').trim();
    if (isOfflineMode(env)) {
      const reachable = await probe(baseUrl);
      if (!reachable) throw new OfflineRecipeUnreachableError('llamacpp-server', baseUrl);
    }
    return createProvider(llamaCppServerAdapter({ baseUrl, model }), {
      acceptsSensitivity: ['public', 'internal'],
    });
  }

  // recipe === 'llamacpp-node' - the in-process GGUF adapter ships in a
  // companion package the example does not statically depend on. The
  // dynamic specifier keeps the workspace lockfile untouched while
  // still letting operators opt in by `pnpm add @graphorin/provider-
  // llamacpp-node` inside the example directory.
  const modelPath = (env.GRAPHORIN_LLM_MODEL_PATH ?? '').trim();
  if (modelPath.length === 0) {
    throw new TypeError(
      `[graphorin/example-personal-assistant-cli] recipe 'llamacpp-node' requires GRAPHORIN_LLM_MODEL_PATH ` +
        `pointing at a local '*.gguf' file.`,
    );
  }
  const adapter = await loadLlamaCppNodeAdapter(modelPath);
  return createProvider(adapter, { acceptsSensitivity: ['public', 'internal'] });
}

/**
 * Build the assistant: opens the SQLite store, instantiates the
 * embedder + memory + chosen provider, registers two working blocks
 * and a sample procedural rule, and returns a handle the caller can
 * stream against.
 */
export async function createAssistant(options: AssistantOptions = {}): Promise<AssistantHandle> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const sessionId = options.sessionId ?? `session_${Date.now().toString(36)}`;
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? 'local-operator').trim();
  const storePath = options.storePath ?? env.GRAPHORIN_DB_PATH ?? ':memory:';

  const store = await createSqliteStore({
    path: storePath,
    ...(storePath === ':memory:' ? { disableWalHardening: true } : {}),
  });
  await store.init();

  const embedder =
    options.embedder === null ? null : (options.embedder ?? createTransformersJsEmbedder({}));

  const provider =
    options.providerOverride ??
    (await buildProvider(recipe, {
      env,
      ...(options.reachabilityProbe !== undefined
        ? { reachabilityProbe: options.reachabilityProbe }
        : {}),
    }));

  const memory = createMemory({
    store: store.memory,
    embeddings: store.embeddings,
    ...(embedder !== null ? { embedder } : {}),
    workingBlocks: [
      defineBlock({
        label: 'persona',
        description: 'How the assistant should present itself.',
        charLimit: 512,
        sensitivity: 'public',
        defaultValue:
          'You are a friendly, concise local-first personal assistant. Prefer short answers.',
      }),
      defineBlock({
        label: 'preferences',
        description: 'User-supplied preferences (units, time zone, tone).',
        charLimit: 1024,
        sensitivity: 'internal',
      }),
    ],
    consolidator: { tier: 'cheap', enabled: true, provider },
    resolveScope: () => ({ userId, sessionId, agentId: 'personal-assistant' }),
  });

  await memory.procedural.define(
    { userId, sessionId, agentId: 'personal-assistant' },
    {
      text: 'When the user shares a stable preference (units, language, tone), remember it for later turns.',
      condition: 'always',
      sensitivity: 'public',
      priority: 60,
    },
  );

  const tracer = optionalTracerFromEnv(env);
  const agent = createAgent<undefined, string>({
    name: 'personal-assistant',
    instructions:
      'You are graphorin, a local-first personal assistant. ' +
      'Answer truthfully, prefer brief replies, and respect any stored user preferences.',
    provider,
    memory,
    sessionId,
    userId,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  return {
    agent,
    memory,
    provider,
    recipe,
    sessionId,
    userId,
    store,
    async close() {
      await store.close();
    },
  };
}

/**
 * Run a single user turn against the assistant. Returns the
 * concatenated `text.delta` payload the agent emitted. Used by the
 * REPL and by the smoke test.
 */
export async function runChatTurn(
  handle: AssistantHandle,
  input: string,
  options: { readonly signal?: AbortSignal; readonly out?: Writable } = {},
): Promise<string> {
  let buffer = '';
  let errored: { readonly message: string; readonly code: string } | undefined;
  const stream = handle.agent.stream(input, {
    sessionId: handle.sessionId,
    userId: handle.userId,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  });
  for await (const ev of stream as AsyncIterable<AgentEvent<string>>) {
    if (ev.type === 'text.delta') {
      buffer += ev.delta;
      options.out?.write(ev.delta);
    } else if (ev.type === 'agent.error') {
      errored = ev.error;
    }
  }
  if (errored !== undefined) {
    throw new Error(
      `[graphorin/example-personal-assistant-cli] agent run failed: ${errored.code} - ${errored.message}`,
    );
  }
  return buffer;
}

/** REPL entry point. Reads stdin lines and streams replies to stdout. */
export async function main(
  args: {
    readonly stdin?: NodeJS.ReadableStream;
    readonly stdout?: Writable;
    readonly stderr?: Writable;
    readonly env?: NodeJS.ProcessEnv;
  } = {},
): Promise<number> {
  const stdin = args.stdin ?? process.stdin;
  const stdout = args.stdout ?? process.stdout;
  const stderr = args.stderr ?? process.stderr;
  const env = args.env ?? process.env;

  let handle: AssistantHandle | undefined;
  try {
    handle = await createAssistant({ env });
  } catch (err) {
    if (err instanceof OfflineRecipeUnreachableError) {
      stderr.write(`${err.message}\n`);
      return 2;
    }
    stderr.write(
      `[graphorin/example-personal-assistant-cli] startup failed: ${stringifyError(err)}\n`,
    );
    return 1;
  }

  const banner =
    `graphorin v${VERSION} personal-assistant-cli - recipe='${handle.recipe}', ` +
    `model='${handle.provider.modelId}'. Type a message and press Enter; Ctrl+C to exit.\n`;
  stdout.write(banner);

  const rl: ReadlineInterface = createInterface({
    input: stdin,
    output: stdout,
    terminal: false,
  });

  const sigintController = new AbortController();
  const onSigint = (): void => {
    stderr.write('\n[graphorin] aborting current turn (Ctrl+C)...\n');
    handle?.agent.abort({ drain: true, onPendingApprovals: 'hold' });
    sigintController.abort();
    rl.close();
  };
  process.once('SIGINT', onSigint);

  try {
    stdout.write('> ');
    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (line.length === 0) {
        stdout.write('> ');
        continue;
      }
      try {
        await runChatTurn(handle, line, { signal: sigintController.signal, out: stdout });
        stdout.write('\n');
      } catch (err) {
        stderr.write(`[graphorin] turn failed: ${stringifyError(err)}\n`);
      }
      stdout.write('> ');
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    await handle.close();
  }
  return 0;
}

async function loadLlamaCppNodeAdapter(modelPath: string): Promise<Provider> {
  type LlamaCppNodeModule = {
    readonly llamaCppNodeAdapter: (opts: { readonly modelPath: string }) => Provider;
  };
  const moduleSpecifier = '@graphorin/provider-llamacpp-node';
  let mod: LlamaCppNodeModule;
  try {
    mod = (await import(moduleSpecifier)) as LlamaCppNodeModule;
  } catch (cause) {
    throw new Error(
      `[graphorin/example-personal-assistant-cli] recipe 'llamacpp-node' needs ` +
        `'${moduleSpecifier}'. Run \`pnpm --filter ./examples/personal-assistant-cli add ${moduleSpecifier}\` ` +
        `(or install it globally) and retry.`,
      { cause },
    );
  }
  return mod.llamaCppNodeAdapter({ modelPath });
}

async function defaultReachabilityProbe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(2_000),
    });
    return res.ok || res.status === 404 || res.status === 405;
  } catch {
    return false;
  }
}

function stringifyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
