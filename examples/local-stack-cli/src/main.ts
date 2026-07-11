/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Fully-local-stack CLI personal assistant - library mode. Wires
 * `createAgent({...})` to a six-tier `Memory` backed by SQLite +
 * sqlite-vec, an Ollama-served LLM (default `qwen2.5:7b-instruct-q4_K_M`),
 * and an Ollama-served embedder (default `nomic-embed-text`). The only
 * network calls leave the process for `127.0.0.1` / `localhost` (the
 * Ollama daemon); everything else lives on disk. The REPL streams
 * `text.delta` events to stdout and unwinds cleanly through
 * `agent.abort({ drain: true, onPendingApprovals: 'hold' })` on
 * `Ctrl+C`. `GRAPHORIN_OFFLINE=1` makes a missing daemon a typed
 * `OllamaUnreachableError` instead of a generic ECONNREFUSED.
 *
 * Memory actually persists (MCON-4 / DEC-150: turn persistence is
 * consumer-emitted, the agent runtime never auto-persists): every REPL
 * turn pushes the user line and the assistant reply through
 * `memory.session.push(...)` and advances the consolidator with a
 * `trigger({ kind: 'turn' }, scope)`, so facts distill into the
 * semantic tier in the background. The agent gets `tools: memory.tools`
 * (model-driven reads/writes) and `autoAssembleContext: true` +
 * `factsAutoRecall`, so facts taught in an earlier session surface in
 * the system prompt of later ones.
 */

import process from 'node:process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import type { Writable } from 'node:stream';
import { type Agent, createAgent } from '@graphorin/agent';
import type { AgentEvent, EmbedderProvider, Provider, SessionScope } from '@graphorin/core';
import { createOllamaEmbedder } from '@graphorin/embedder-ollama';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import {
  createMemory,
  defineAutoRecallStrategy,
  defineBlock,
  type Memory,
} from '@graphorin/memory';
import { createProvider, ollamaAdapter } from '@graphorin/provider';
import { JsTiktokenCounter } from '@graphorin/provider/counters';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import { createStubEmbedder } from './stub-embedder.js';
import { createStubProvider } from './stub-provider.js';

export const VERSION: string = pkg.version;

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

/** Default context window for the qwen2.5 family served by Ollama. */
const DEFAULT_CONTEXT_WINDOW = 32_768;
/** Matches the stub provider's declared `capabilities.contextWindow`. */
const STUB_CONTEXT_WINDOW = 8_192;

/**
 * Procedural rule seeded once per database. The exact text doubles as
 * the idempotency key: `createAssistant` skips `procedural.define`
 * when a rule with this text already exists for the user scope, so
 * repeated launches do not accumulate duplicate rules.
 */
export const LOCAL_STACK_RULE_TEXT =
  'Stay fully local: never reach for cloud APIs. If the user mentions an external ' +
  'service, suggest a local equivalent first.';

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
        `ollama pull nomic-embed-text\`) - or unset GRAPHORIN_OFFLINE to surface the underlying ` +
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
  readonly scope: SessionScope;
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

/**
 * Resolve the provider context window (tokens) that arms the context
 * engine's auto-compaction. `GRAPHORIN_CONTEXT_WINDOW` overrides;
 * defaults to 32768 for the Ollama-served qwen2.5 family and to the
 * stub provider's declared 8192.
 */
export function resolveContextWindow(recipe: Recipe, env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.GRAPHORIN_CONTEXT_WINDOW?.trim();
  if (raw !== undefined && raw.length > 0) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    throw new TypeError(
      `[graphorin/example-local-stack-cli] Invalid GRAPHORIN_CONTEXT_WINDOW='${raw}' ` +
        `(positive integer expected).`,
    );
  }
  return recipe === 'stub' ? STUB_CONTEXT_WINDOW : DEFAULT_CONTEXT_WINDOW;
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
 * 'secret'] })` - loopback trust auto-elects the all-tiers default,
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
 * embedder + memory + provider, registers two working blocks, seeds a
 * sample procedural rule (idempotently - restarts do not duplicate
 * it), starts the consolidator runtime, and returns a handle the
 * caller can stream against.
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

  const scope: SessionScope = { userId, sessionId, agentId: AGENT_ID };

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
    consolidator: {
      tier: 'cheap',
      enabled: true,
      provider,
      defaultScope: scope,
      // MCON-2 opt-in: injection-clean extraction facts land `active`
      // instead of quarantined, so routine distillation surfaces in
      // default recall without a manual promote step. Appropriate for a
      // single-user local assistant; injection-flagged facts still
      // quarantine.
      autoPromoteExtraction: true,
    },
    contextEngine: {
      // CE-12: without a context window the auto-compaction threshold is
      // Infinity and the framework WARNs at startup.
      providerContextWindow: resolveContextWindow(recipe, env),
      // Loopback trust would default auto-compaction OFF - keep it
      // explicitly armed for long REPL sessions.
      compaction: {},
      // CE-13: budget with a real tokenizer instead of the chars/4
      // heuristic (js-tiktoken is offline - no network).
      tokenCounter: new JsTiktokenCounter(),
      // The stack is loopback-only by construction
      // (assertLocalStackOllamaUrl), so internal-sensitivity memory may
      // flow to the provider; the engine's default 'public-tls' trust
      // would silently drop it from the assembled prompt.
      privacy: {
        providerTrust: 'loopback',
        ...(provider.acceptsSensitivity !== undefined
          ? { providerAcceptsSensitivity: provider.acceptsSensitivity }
          : {}),
      },
      // Surfaces consolidated facts in the assembled system prompt, so a
      // fact taught in an earlier session is recalled deterministically.
      // The default locale heuristic only fires on explicit memory
      // phrasing ("remember...", "last time..."), which misses plain
      // questions like "what is my favorite juice?" - recall on every
      // non-empty turn instead (one local embed call per turn).
      factsAutoRecall: {
        topK: 5,
        strategy: defineAutoRecallStrategy({
          id: 'every-user-turn',
          evaluate: ({ lastUserMessage }) => ({
            factsTriggered: lastUserMessage.trim().length > 0,
            reason: 'every-user-turn',
          }),
        }),
      },
    },
    resolveScope: () => scope,
  });

  // Idempotent rule seeding: `procedural.define` always inserts a new
  // rule id, so guard on the exact text to keep restarts duplicate-free.
  const existingRules = await memory.procedural.list(scope);
  if (!existingRules.some((rule) => rule.text === LOCAL_STACK_RULE_TEXT)) {
    await memory.procedural.define(scope, {
      text: LOCAL_STACK_RULE_TEXT,
      condition: 'always',
      sensitivity: 'public',
      priority: 60,
    });
  }

  // Turn triggers are ignored until the consolidator runtime starts
  // (trigger() returns null when not running).
  await memory.consolidator.start();

  const tracer = optionalTracerFromEnv(env);
  const agent = createAgent<undefined, string>({
    name: AGENT_ID,
    instructions:
      'You are graphorin running on a fully-local stack: Ollama for the LLM, Ollama for ' +
      'embeddings, and SQLite + sqlite-vec for storage. Answer truthfully, prefer brief ' +
      'replies, respect any stored user preferences, and never recommend cloud-only services ' +
      'when a local equivalent exists.',
    provider,
    tools: memory.tools,
    memory,
    autoAssembleContext: true,
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
    scope,
    store,
    async close() {
      try {
        await memory.consolidator.stop();
      } catch {
        // Best-effort.
      }
      await store.close();
    },
  };
}

/** Per-handle REPL turn counter (feeds the consolidator turn trigger). */
const turnCounters = new WeakMap<AssistantHandle, number>();

/**
 * Run a single user turn against the assistant. Persists both sides of
 * the turn through `memory.session.push(...)` and advances the
 * consolidator with a turn trigger (MCON-4: turn persistence is
 * consumer-emitted, the agent runtime never auto-persists). Returns the
 * concatenated `text.delta` payload. Used by the REPL and the smoke
 * test.
 */
export async function runChatTurn(
  handle: AssistantHandle,
  input: string,
  options: { readonly signal?: AbortSignal; readonly out?: Writable } = {},
): Promise<string> {
  // Persist the user line before the model call so the consolidator's
  // standard phase sees the turn even when the reply fails.
  await handle.memory.session.push(handle.scope, { role: 'user', content: input });
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
      `[graphorin/example-local-stack-cli] agent run failed: ${errored.code} - ${errored.message}`,
    );
  }
  if (buffer.length > 0) {
    await handle.memory.session.push(handle.scope, { role: 'assistant', content: buffer });
  }
  const turn = (turnCounters.get(handle) ?? 0) + 1;
  turnCounters.set(handle, turn);
  await handle.memory.consolidator.trigger({ kind: 'turn', value: turn }, handle.scope);
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
    `graphorin v${VERSION} local-stack-cli - recipe='${handle.recipe}', ` +
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

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
