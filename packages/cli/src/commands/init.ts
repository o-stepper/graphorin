/**
 * `graphorin init` - interactive bootstrap.
 *
 * Writes a fresh `graphorin.config.ts` (or, with `--format json`, a
 * plain `graphorin.config.json`) to the current working directory
 * (or `--out`), prompts the operator for the cloud-upload
 * sensitivity tier + storage encryption opt-in, prints the server
 * pepper hex ONCE, and walks the operator through the working
 * credential path: persist the pepper (stdin, never argv), migrate,
 * then mint a real token with `graphorin token create`.
 *
 * Init deliberately does NOT emit a token itself. Token
 * verification requires an HMAC lookup in the auth-token store, which
 * requires migrations + the pepper - init's contract is "write the
 * config file, touch nothing else" (pinned by tests), so any token it
 * printed was guaranteed to 401. Honestly pointing at `token create`
 * follows the no-phantom-credentials precedent.
 *
 * `--non-interactive` accepts every choice through flags or env vars
 * so the command works equally well in CI / image-build pipelines.
 *
 * @packageDocumentation
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import process from 'node:process';

import { generatePepper } from '@graphorin/security';

import { shellQuotePath } from '../internal/output.js';
import { confirm, select } from '../internal/prompts.js';

/**
 * @stable
 */
export interface InitCommandOptions {
  readonly out?: string;
  /**
   * Config flavour. `'ts'` (default) writes a `defineConfig`
   * `graphorin.config.ts` - loading it later requires a Node that can
   * import TypeScript (23.6+/22.18+ type stripping or a registered
   * loader like tsx) AND `@graphorin/server` resolvable from the
   * config's directory. `'json'` writes a plain `graphorin.config.json`
   * with the same content (the docker-template flavour) that loads
   * anywhere with zero runtime requirements.
   */
  readonly format?: 'ts' | 'json';
  readonly nonInteractive?: boolean;
  readonly cloudConsent?: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly encrypted?: boolean;
  readonly cwd?: string;
  /**
   * Also scaffold a `graphorin.app.mjs` compose module next to the
   * config and reference it via the config's `app` field, so
   * `graphorin start` serves the full domain surface (sessions /
   * memory REST adapters over the configured SQLite store) instead of
   * the bare infrastructure daemon. Default `false` - the historical
   * infra-only init is unchanged.
   */
  readonly app?: boolean;
  /**
   * deep-retest-0.13.11: CI-safe pepper handling. Write the generated
   * pepper hex to this file (mode `0600`, never overwrites) INSTEAD of
   * printing it - non-interactive bootstrap logs (CI, image builds)
   * otherwise capture the key material behind every token HMAC.
   */
  readonly pepperOut?: string;
  /** Test seam: skip writing files (only print the report). */
  readonly dryRun?: boolean;
  /** Test seam: redirect stdout/err. */
  readonly print?: (line: string) => void;
}

/**
 * @stable
 */
export interface InitCommandResult {
  readonly configPath: string;
  readonly serverPepperHex: string;
  readonly cloudConsent: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly storageEncrypted: boolean;
  /** Absolute path of the scaffolded app module (with `--app` only). */
  readonly appPath?: string;
  /** Absolute path the pepper hex was written to (with `--pepper-out` only). */
  readonly pepperOutPath?: string;
}

/**
 * @stable
 */
export async function runInit(options: InitCommandOptions = {}): Promise<InitCommandResult> {
  const cwd = options.cwd ?? process.cwd();
  const format = resolveFormat(options);
  const target = resolveOutPath(cwd, options.out, format);
  const print = options.print ?? ((line: string) => process.stderr.write(`${line}\n`));

  const cloudConsent = await resolveCloudConsent(options);
  const storageEncrypted = await resolveEncryption(options);

  const pepper = generatePepper();
  const pepperHex = await pepper.useBuffer((buf) => buf.toString('hex'));

  const appModulePath =
    options.app === true ? resolve(dirname(target), APP_MODULE_NAME) : undefined;
  const pepperOutPath =
    options.pepperOut !== undefined ? resolve(cwd, options.pepperOut) : undefined;

  if (options.dryRun !== true) {
    if (await fileExists(target)) {
      throw new Error(
        `[graphorin/cli] refusing to overwrite existing '${target}'. Move it aside or pass --out <path>.`,
      );
    }
    if (appModulePath !== undefined && (await fileExists(appModulePath))) {
      throw new Error(
        `[graphorin/cli] refusing to overwrite existing '${appModulePath}'. Move it aside first.`,
      );
    }
    if (pepperOutPath !== undefined && (await fileExists(pepperOutPath))) {
      throw new Error(
        `[graphorin/cli] refusing to overwrite existing '${pepperOutPath}'. Move it aside first.`,
      );
    }
    await mkdir(dirname(target), { recursive: true });
    const content =
      format === 'json'
        ? renderConfigJson({ cloudConsent, storageEncrypted, app: options.app === true })
        : renderConfig({ cloudConsent, storageEncrypted, app: options.app === true });
    await writeFile(target, content, { mode: 0o600 });
    if (appModulePath !== undefined) {
      await writeFile(appModulePath, renderAppModule(), { mode: 0o600 });
    }
    if (pepperOutPath !== undefined) {
      await mkdir(dirname(pepperOutPath), { recursive: true });
      await writeFile(pepperOutPath, `${pepperHex}\n`, { mode: 0o600 });
    }
  }

  print(`[graphorin/cli] wrote ${target}`);
  if (appModulePath !== undefined) {
    print(`[graphorin/cli] wrote ${appModulePath} (app-compose module; edit it to shape your API)`);
  }
  // deep-retest-0.13.11: `--pepper-out` keeps the pepper hex OUT of the
  // terminal/CI log - the one-time print below is fine interactively
  // but a build log retains it forever.
  if (pepperOutPath !== undefined) {
    print(
      `[graphorin/cli] server pepper hex written to ${pepperOutPath} (mode 0600) - not printed`,
    );
  } else {
    print(
      `[graphorin/cli] server pepper hex (store in your keyring as 'graphorin_server_pepper'):`,
    );
    print(`  ${pepperHex}`);
  }
  print('');
  print('Next steps:');
  // W-041: never put the pepper on argv - shell history and the process
  // list would hold the key material behind every token HMAC (the
  // secrets CLI itself refuses plaintext on the command line).
  if (pepperOutPath !== undefined) {
    print(
      `  1. Persist the pepper WITHOUT argv: graphorin secrets set graphorin_server_pepper --from-stdin < ${shellQuotePath(pepperOutPath)} - then delete the file.`,
    );
  } else {
    print(
      `  1. Persist the pepper WITHOUT argv: printf '%s' '<hex-from-above>' | graphorin secrets set graphorin_server_pepper --from-stdin`,
    );
  }
  print(
    `  2. Run \`graphorin migrate --config ${shellQuotePath(target)}\` to apply storage migrations.`,
  );
  print(
    '  3. Mint your admin token: graphorin token create --label bootstrap --scopes <scopes> (the raw token is shown ONCE).',
  );
  print(`  4. Run \`graphorin start --config ${shellQuotePath(target)}\` to launch the server.`);
  // P1-4 (deep retest 2026-07-19): the consent tier is a MEMORY-side
  // setting - the server config cannot enforce it, so hand the operator
  // the exact code instead of a decorative option.
  print(`  5. Enforce your cloud-consent tier ('${cloudConsent}') where you compose memory:`);
  for (const line of consentSnippet(cloudConsent)) {
    print(`       ${line}`);
  }

  return Object.freeze({
    configPath: target,
    serverPepperHex: pepperHex,
    cloudConsent,
    storageEncrypted,
    ...(appModulePath !== undefined ? { appPath: appModulePath } : {}),
    ...(pepperOutPath !== undefined ? { pepperOutPath } : {}),
  });
}

/** File name of the scaffolded compose module (next to the config). */
const APP_MODULE_NAME = 'graphorin.app.mjs';

function resolveFormat(options: InitCommandOptions): 'ts' | 'json' {
  if (options.format !== undefined) {
    if (options.format !== 'ts' && options.format !== 'json') {
      throw new Error(`[graphorin/cli] --format must be 'ts' or 'json' (got '${options.format}').`);
    }
    // A --format that contradicts the --out extension would write a
    // config the loader mis-parses (the loader picks the parser by
    // extension) - refuse instead of writing a landmine.
    if (options.out !== undefined && options.out.length > 0) {
      const jsonOut = options.out.endsWith('.json');
      if (options.format === 'json' && !jsonOut) {
        throw new Error(
          `[graphorin/cli] --format json requires an --out ending in '.json' (got '${options.out}').`,
        );
      }
      if (options.format === 'ts' && jsonOut) {
        throw new Error(
          `[graphorin/cli] --format ts conflicts with the '.json' --out '${options.out}'.`,
        );
      }
    }
    return options.format;
  }
  if (options.out?.endsWith('.json')) return 'json';
  return 'ts';
}

function resolveOutPath(cwd: string, out: string | undefined, format: 'ts' | 'json'): string {
  if (out === undefined || out.length === 0) return resolve(cwd, `graphorin.config.${format}`);
  return isAbsolute(out) ? out : resolve(cwd, out);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveCloudConsent(
  options: InitCommandOptions,
): Promise<'public-only' | 'public-and-internal' | 'all-with-warnings'> {
  if (options.cloudConsent !== undefined) return options.cloudConsent;
  const envValue = process.env.GRAPHORIN_CLOUD_CONSENT;
  if (
    envValue === 'public-only' ||
    envValue === 'public-and-internal' ||
    envValue === 'all-with-warnings'
  ) {
    return envValue;
  }
  if (options.nonInteractive === true) return 'public-and-internal';
  const choice = await select(
    'Cloud-upload consent for context sent to providers:',
    ['public-only', 'public-and-internal', 'all-with-warnings'],
    'public-and-internal',
  );
  return choice as 'public-only' | 'public-and-internal' | 'all-with-warnings';
}

async function resolveEncryption(options: InitCommandOptions): Promise<boolean> {
  if (options.encrypted !== undefined) return options.encrypted;
  if (process.env.GRAPHORIN_STORAGE_ENCRYPTED === '1') return true;
  if (process.env.GRAPHORIN_STORAGE_ENCRYPTED === '0') return false;
  if (options.nonInteractive === true) return false;
  return await confirm('Enable storage encryption (defense-in-depth on top of FDE)?', false);
}

function renderConfig(input: {
  readonly cloudConsent: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly storageEncrypted: boolean;
  readonly app?: boolean;
}): string {
  return `import { defineConfig } from '@graphorin/server';

export default defineConfig({${
    input.app === true
      ? `
  // Compose module: \`graphorin start\` imports it and mounts the
  // returned sessions / memory / agents adapters.
  app: './graphorin.app.mjs',`
      : ''
  }
  server: {
    host: '127.0.0.1',
    port: 8080,
  },
  auth: {
    kind: 'token',
    pepperRef: 'keyring:graphorin_server_pepper',
  },
  storage: {
    path: './.graphorin/data.db',
    mode: 'server',
    encryption: ${
      input.storageEncrypted
        ? `{
      enabled: true,
      passphraseRef: 'keyring:graphorin_db_passphrase',
    }`
        : `{ enabled: false }`
    },
  },
  audit: {
    enabled: ${input.storageEncrypted ? 'true' : 'false'},
  },
  secrets: {
    source: 'auto',
    strict: false,
  },
  observability: {
    logger: 'json',
  },
  // IP-5: no top-level 'defaults' block - the strict server-config
  // parser rejects unknown keys, so the old render made a fresh
  // 'graphorin init' fail on the very next migrate/start. Memory is
  // composed in CODE, not by this server config - the cloud-consent
  // tier you chose at init ('${input.cloudConsent}') is enforced where
  // you call createMemory(...):
  //
${consentSnippet(input.cloudConsent)
  .map((line) => (line.length > 0 ? `  //   ${line}` : '  //'))
  .join('\n')}
});
`;
}

/**
 * the exact `createMemory` privacy
 * snippet that ENFORCES the chosen cloud-consent tier. `init` cannot
 * wire it itself (memory composition is programmatic by design - the
 * server config carries no adapters), so the honest contract is: record
 * the choice, and hand the operator the precise code in both the
 * `next steps` output and the .ts config comment.
 */
export function consentSnippet(
  tier: 'public-only' | 'public-and-internal' | 'all-with-warnings',
): ReadonlyArray<string> {
  switch (tier) {
    case 'public-only':
      return [
        "// 'public-only' is the fail-closed default: cloud providers",
        "// receive only 'public'-sensitivity context. Nothing to add:",
        'const memory = createMemory({ store });',
      ];
    case 'public-and-internal':
      return [
        'const memory = createMemory({',
        '  store,',
        '  contextEngine: {',
        '    privacy: { cloudUploadConsent: true },',
        '  },',
        '});',
        "// The provider must also accept 'internal' payloads, e.g.:",
        "//   acceptsSensitivity: ['public', 'internal']",
      ];
    case 'all-with-warnings':
      return [
        'const memory = createMemory({',
        '  store,',
        '  contextEngine: {',
        '    privacy: { cloudUploadConsent: true },',
        '  },',
        '});',
        '// ...and the provider must accept every tier it should see:',
        "//   acceptsSensitivity: ['public', 'internal', 'secret']",
        '// Trace redaction still validates exported spans; review the',
        '// security guide before shipping secret-tier context to a cloud.',
      ];
  }
}

// F-05: the defineConfig-free flavour (same shape as the docker
// template). JSON cannot carry comments, so the enforcement snippet the
// .ts render embeds is delivered through the stderr next-steps (step 5)
// and the command's return payload instead - both flavours hand the
// operator the same createMemory privacy code (P1-4).
function renderConfigJson(input: {
  readonly cloudConsent: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly storageEncrypted: boolean;
  readonly app?: boolean;
}): string {
  const config = {
    ...(input.app === true ? { app: './graphorin.app.mjs' } : {}),
    server: {
      host: '127.0.0.1',
      port: 8080,
    },
    auth: {
      kind: 'token',
      pepperRef: 'keyring:graphorin_server_pepper',
    },
    storage: {
      path: './.graphorin/data.db',
      mode: 'server',
      encryption: input.storageEncrypted
        ? { enabled: true, passphraseRef: 'keyring:graphorin_db_passphrase' }
        : { enabled: false },
    },
    audit: {
      enabled: input.storageEncrypted,
    },
    secrets: {
      source: 'auto',
      strict: false,
    },
    observability: {
      logger: 'json',
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

/**
 * the scaffolded `graphorin.app.mjs`. Composes the
 * configured SQLite store + memory + sessions and returns the adapter
 * bag `graphorin start` spreads into `createServer(...)`. Written as
 * plain ESM so it runs on any Node without a TS loader; every call in
 * it is real (the CLI integration test boots a server through it).
 */
function renderAppModule(): string {
  return `/**
 * graphorin.app.mjs - app-compose module for \`graphorin start\`.
 *
 * The launcher imports this file (config \`app\` field), calls the
 * default-exported factory with { config, configPath, configDir }, and
 * spreads the returned bag into createServer(...): the sessions and
 * memory REST surfaces below mount at /v1/sessions and /v1/memory.
 * Extend the bag with agents / workflows / consolidator as your app
 * grows - see the standalone-server guide.
 */
import { resolve } from 'node:path';

import { createMemory } from '@graphorin/memory';
import { createSessionManager } from '@graphorin/sessions';
import { createSqliteStore } from '@graphorin/store-sqlite';

export default async function createApp({ config, configDir }) {
  const store = await createSqliteStore({
    path: config.storage.path === ':memory:' ? ':memory:' : resolve(configDir, config.storage.path),
    mode: config.storage.mode,
  });
  await store.init();

  const memory = createMemory({ store: store.memory, embeddings: store.embeddings });
  const sessions = createSessionManager({ store: store.sessions, memory: memory.session });

  return {
    // The server reuses this store for its infrastructure surfaces and
    // never closes an injected store - the close hook below owns it.
    store,
    sessions: sessionApi(sessions),
    memory: memoryApi(memory),
    // agents: build an AgentRegistry with your Agent instances to serve
    // POST /v1/agents/:id/invoke.
    close: async () => {
      await store.close();
    },
  };
}

/** Thin SessionApi shim over the SessionManager facade. */
function sessionApi(sessions) {
  return {
    list: (opts) => sessions.listSessions(opts),
    get: async (sessionId) => {
      const session = await sessions.find(sessionId);
      return session === null ? null : await session.metadata();
    },
    create: async (input) => {
      const session = await sessions.create(input);
      return await session.metadata();
    },
    remove: async (sessionId) => {
      if ((await sessions.find(sessionId)) === null) return false;
      await sessions.deleteSession(sessionId);
      return true;
    },
    listMessages: async (sessionId, opts) => {
      const session = await sessions.find(sessionId);
      return session === null ? [] : await session.list(opts);
    },
    // Handoffs live on run state; surface them here once your app
    // records agent-to-agent handoffs.
    listHandoffs: async () => [],
  };
}

/** Thin MemoryApi shim over the memory facade (semantic + working tiers). */
function memoryApi(memory) {
  return {
    search: (input) =>
      memory.semantic.search(input.scope, input.query, {
        ...(input.topK !== undefined ? { limit: input.topK } : {}),
      }),
    remember: async (input) => {
      const fact = await memory.semantic.remember(input.scope, {
        text: input.text,
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      });
      return { factId: fact.id };
    },
    forget: async (scope, factId) => {
      await memory.semantic.forget(scope, factId);
      return true;
    },
    upsertBlock: async (input) => {
      await memory.working.write(input.scope, input.label, input.body);
      return { label: input.label };
    },
    deleteBlock: async (scope, label) => {
      await memory.working.forget(scope, label);
      return true;
    },
  };
}
`;
}
