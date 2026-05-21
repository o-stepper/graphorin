/**
 * Graphorin v0.2.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Fully-local-stack CLI personal assistant — library mode. Wires
 * `createAgent({...})` to a six-tier `Memory` backed by SQLite +
 * sqlite-vec, an Ollama-served LLM (default `qwen2.5:7b-instruct-q4_K_M`),
 * and an Ollama-served embedder (default `nomic-embed-text`). The only
 * network calls leave the process for `127.0.0.1` / `localhost` (the
 * Ollama daemon); everything else lives on disk. The REPL streams
 * `text.delta` events to stdout and unwinds cleanly through
 * `agent.abort({ drain: true, onPendingApprovals: 'hold' })` on
 * `Ctrl+C`. `GRAPHORIN_OFFLINE=1` makes a missing daemon a typed
 * `OllamaUnreachableError` instead of a generic ECONNREFUSED.
 */

import process from 'node:process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import type { Writable } from 'node:stream';
import { type Agent, createAgent } from '@graphorin/agent';
import type { AgentEvent, EmbedderProvider, Provider } from '@graphorin/core';
import { createOllamaEmbedder } from '@graphorin/embedder-ollama';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createMemory, defineBlock, type Memory } from '@graphorin/memory';
import { createProvider, ollamaAdapter } from '@graphorin/provider';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { createStubEmbedder } from './stub-embedder.js';
import { createStubProvider } from './stub-provider.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.2.0';

/**
 * Recipe selector. The example only ships the all-local Ollama stack
 * (`'ollama'`) plus a deterministic `'stub'` used by the smoke test;
 * other LLM stacks live in `examples/personal-assistant-cli`.
 */
export type Recipe = 'ollama' | 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['ollama', 'stub'];

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_LLM_MODEL = 'qwen2.5:7b-instruct-q4_K_M';
const DEFAULT_EMBED_MODEL = 'nomic-embed-text';
const AGENT_ID = 'local-stack-assistant';

/**
 * Raised when the Ollama daemon required by the chosen recipe is not
 * reachable at the configured `baseUrl`. Always emitted under
 * `GRAPHORIN_OFFLINE=1`, optionally emitted otherwise (the CLI lets
 * the underlying `fetch` failure surface so operators see the original
 * error, but `createAssistant({...})` callers can opt in to the typed
 * variant via `requireReachableOllama: true`).
 */
export class OllamaUnreachableError extends Error {
  override readonly name = 'OllamaUnreachableError';
  readonly endpoint: string;
  constructor(endpoint: string, cause?: unknown) {
    super(
      `[graphorin/example-local-stack-cli] Ollama daemon is not reachable at '${endpoint}'. ` +
        `Start it with \`ollama serve\` (and \`ollama pull qwen2.5:7b-instruct-q4_K_M && ` +
        `ollama pull nomic-embed-text\`) — or unset GRAPHORIN_OFFLINE to surface the underlying ` +
        `network error.`,
    );
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
  /** Inject an embedder (defaults to the Ollama embedder). */
  readonly embedder?: EmbedderProvider | null;
  /** Inject a `Provider` directly (bypasses the recipe selector). */
  readonly providerOverride?: Provider;
  /**
   * Override the reachability probe (used by the smoke test). Returns
   * `true` when the endpoint accepts a TCP/HTTP connection.
   */
  readonly reachabilityProbe?: (url: string) => Promise<boolean>;
  /**
   * When `true`, probe the Ollama daemon during `buildProvider` and
   * raise {@link OllamaUnreachableError} on failure regardless of
   * `GRAPHORIN_OFFLINE`. Defaults to `false`; the REPL trips this
   * implicitly when `GRAPHORIN_OFFLINE=1` is set.
   */
  readonly requireReachableOllama?: boolean;
}

/** Handle returned by {@link createAssistant}. */
export interface AssistantHandle {
  readonly agent: Agent<undefined, string>;
  readonly memory: Memory;
  readonly provider: Provider;
  readonly embedder: EmbedderProvider | null;
  readonly recipe: Recipe;
  readonly sessionId: string;
  readonly userId: string;
  readonly store: GraphorinSqliteStore;
  close(): Promise<void>;
}

/**
 * Resolve the configured recipe. Defaults to `'ollama'` to match the
 * README headline.
 */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'ollama').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-local-stack-cli] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
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

const LOOPBACK_OLLAMA_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizedHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower.startsWith('[') && lower.endsWith(']')) {
    return lower.slice(1, -1);
  }
  return lower;
}

/**
 * Refuses remote hostnames so this fully-local example cannot accidentally
 * aim `GRAPHORIN_OLLAMA_BASE_URL` at a wide-area endpoint (CI analogue for
 * strict non-localhost guarantees).
 */
export function assertLocalStackOllamaUrl(baseUrl: string): void {
  let hostname: string;
  try {
    hostname = normalizedHostname(new URL(baseUrl.trim()).hostname);
  } catch {
    throw new TypeError(
      `[graphorin/example-local-stack-cli] Invalid Ollama base URL: ${String(baseUrl)}`,
    );
  }
  if (!LOOPBACK_OLLAMA_HOSTS.has(hostname)) {
    throw new TypeError(
      `[graphorin/example-local-stack-cli] Loopback-only stack: Ollama URL hostname must be ` +
        `'127.0.0.1', 'localhost', or '::1' (got '${hostname}'). For LAN or remote daemons ` +
        `use examples/personal-assistant-cli instead.`,
    );
  }
}

/**
 * Build the configured `Provider`. The Ollama recipe is wrapped through
 * `createProvider(adapter, { acceptsSensitivity: ['public', 'internal',
 * 'secret'] })` — loopback trust auto-elects the all-tiers default,
 * but pinning it explicitly here documents the intent and keeps the
 * stub recipe consistent.
 */
export async function buildProvider(
  recipe: Recipe,
  options: {
    readonly env?: NodeJS.ProcessEnv;
    readonly reachabilityProbe?: (url: string) => Promise<boolean>;
    readonly requireReachableOllama?: boolean;
  } = {},
): Promise<Provider> {
  const env = options.env ?? process.env;
  const probe = options.reachabilityProbe ?? defaultReachabilityProbe;

  if (recipe === 'stub') {
    return createProvider(createStubProvider(), {
      acceptsSensitivity: ['public', 'internal', 'secret'],
    });
  }

  const baseUrl = (env.GRAPHORIN_OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).trim();
  assertLocalStackOllamaUrl(baseUrl);
  const model = (env.GRAPHORIN_LLM_MODEL ?? DEFAULT_LLM_MODEL).trim();
  const mustProbe = options.requireReachableOllama === true || isOfflineMode(env);
  if (mustProbe) {
    const reachable = await probe(baseUrl);
    if (!reachable) throw new OllamaUnreachableError(baseUrl);
  }
  return createProvider(ollamaAdapter({ baseUrl, model }), {
    acceptsSensitivity: ['public', 'internal', 'secret'],
  });
}

/**
 * Build the configured embedder. The Ollama embedder shares the
 * daemon URL and accepts an independent `GRAPHORIN_EMBED_MODEL`
 * override (default `nomic-embed-text`). The stub recipe returns a
 * deterministic 8-dim embedder so smoke tests do not need a network.
 */
export function buildEmbedder(
  recipe: Recipe,
  options: { readonly env?: NodeJS.ProcessEnv } = {},
): EmbedderProvider {
  const env = options.env ?? process.env;
  if (recipe === 'stub') {
    return createStubEmbedder();
  }
  const baseUrl = (env.GRAPHORIN_OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).trim();
  assertLocalStackOllamaUrl(baseUrl);
  const model = (env.GRAPHORIN_EMBED_MODEL ?? DEFAULT_EMBED_MODEL).trim();
  return createOllamaEmbedder({ baseUrl, model });
}

/**
 * Build the assistant: opens the SQLite store, instantiates the
 * embedder + memory + provider, registers two working blocks and a
 * sample procedural rule, and returns a handle the caller can stream
 * against.
 */
export async function createAssistant(options: AssistantOptions = {}): Promise<AssistantHandle> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const sessionId = options.sessionId ?? `session_${Date.now().toString(36)}`;
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? 'local-operator').trim();
  const storePath = options.storePath ?? env.GRAPHORIN_DB_PATH ?? './.graphorin/local-stack-cli.db';

  const store = await createSqliteStore({
    path: storePath,
    mode: 'lib',
    ...(storePath === ':memory:' ? { disableWalHardening: true } : {}),
  });
  await store.init();

  const embedder =
    options.embedder === null ? null : (options.embedder ?? buildEmbedder(recipe, { env }));

  const provider =
    options.providerOverride ??
    (await buildProvider(recipe, {
      env,
      ...(options.reachabilityProbe !== undefined
        ? { reachabilityProbe: options.reachabilityProbe }
        : {}),
      ...(options.requireReachableOllama !== undefined
        ? { requireReachableOllama: options.requireReachableOllama }
        : {}),
    }));

  const memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    ...(embedder !== null ? { embedder } : {}),
    workingBlocks: [
      defineBlock({
        label: 'persona',
        description: 'How the assistant should present itself.',
        charLimit: 512,
        sensitivity: 'public',
        defaultValue:
          'You are a fully-local-stack assistant. Everything (LLM, embeddings, storage) runs ' +
          'on this machine. Prefer short answers.',
      }),
      defineBlock({
        label: 'local_setup',
        description: 'Operator-supplied notes about the local stack (model name, hardware, …).',
        charLimit: 1024,
        sensitivity: 'internal',
      }),
    ],
    consolidator: { tier: 'cheap', enabled: true, provider },
    resolveScope: () => ({ userId, sessionId, agentId: AGENT_ID }),
  });

  await memory.procedural.define(
    { userId, sessionId, agentId: AGENT_ID },
    {
      text:
        'Stay fully local: never reach for cloud APIs. If the user mentions an external ' +
        'service, suggest a local equivalent first.',
      condition: 'always',
      sensitivity: 'public',
      priority: 60,
    },
  );

  const tracer = optionalTracerFromEnv(env);
  const agent = createAgent<undefined, string>({
    name: AGENT_ID,
    instructions:
      'You are graphorin running on a fully-local stack: Ollama for the LLM, Ollama for ' +
      'embeddings, and SQLite + sqlite-vec for storage. Answer truthfully, prefer brief ' +
      'replies, respect any stored user preferences, and never recommend cloud-only services ' +
      'when a local equivalent exists.',
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
    embedder,
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
 * concatenated `text.delta` payload. Used by the REPL and the smoke
 * test.
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
      `[graphorin/example-local-stack-cli] agent run failed: ${errored.code} — ${errored.message}`,
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
    if (err instanceof OllamaUnreachableError) {
      stderr.write(`${err.message}\n`);
      return 2;
    }
    stderr.write(`[graphorin/example-local-stack-cli] startup failed: ${stringifyError(err)}\n`);
    return 1;
  }

  const banner =
    `graphorin v${VERSION} local-stack-cli — recipe='${handle.recipe}', ` +
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
