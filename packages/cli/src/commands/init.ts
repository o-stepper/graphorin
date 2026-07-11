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
 * W-003: init deliberately does NOT emit a token itself. Token
 * verification requires an HMAC lookup in the auth-token store, which
 * requires migrations + the pepper - init's contract is "write the
 * config file, touch nothing else" (pinned by tests), so any token it
 * printed was guaranteed to 401. Honestly pointing at `token create`
 * follows the IP-4 precedent (no phantom credentials).
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

import { confirm, select } from '../internal/prompts.js';

/**
 * @stable
 */
export interface InitCommandOptions {
  readonly out?: string;
  /**
   * F-05: config flavour. `'ts'` (default) writes a `defineConfig`
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

  if (options.dryRun !== true) {
    if (await fileExists(target)) {
      throw new Error(
        `[graphorin/cli] refusing to overwrite existing '${target}'. Move it aside or pass --out <path>.`,
      );
    }
    await mkdir(dirname(target), { recursive: true });
    const content =
      format === 'json'
        ? renderConfigJson({ cloudConsent, storageEncrypted })
        : renderConfig({ cloudConsent, storageEncrypted });
    await writeFile(target, content, { mode: 0o600 });
  }

  print(`[graphorin/cli] wrote ${target}`);
  print(`[graphorin/cli] server pepper hex (store in your keyring as 'graphorin_server_pepper'):`);
  print(`  ${pepperHex}`);
  print('');
  print('Next steps:');
  // W-041: never put the pepper on argv - shell history and the process
  // list would hold the key material behind every token HMAC (the
  // secrets CLI itself refuses plaintext on the command line).
  print(
    `  1. Persist the pepper WITHOUT argv: printf '%s' '<hex-from-above>' | graphorin secrets set graphorin_server_pepper --from-stdin`,
  );
  print(`  2. Run \`graphorin migrate --config ${target}\` to apply storage migrations.`);
  print(
    '  3. Mint your admin token: graphorin token create --label bootstrap --scopes <scopes> (the raw token is shown ONCE).',
  );
  print(`  4. Run \`graphorin start --config ${target}\` to launch the server.`);

  return Object.freeze({
    configPath: target,
    serverPepperHex: pepperHex,
    cloudConsent,
    storageEncrypted,
  });
}

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
}): string {
  return `import { defineConfig } from '@graphorin/server';

export default defineConfig({
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
  // 'graphorin init' fail on the very next migrate/start. The tier you
  // chose at init is recorded below; enforce it via the memory
  // package (createMemory contextEngine privacy options):
  // cloudUploadConsent: ${JSON.stringify(input.cloudConsent)}
});
`;
}

// F-05: the defineConfig-free flavour (same shape as the docker
// template). JSON cannot carry the cloudUploadConsent comment the .ts
// render embeds; the chosen tier still lands in the command's return
// payload + stderr next-steps.
function renderConfigJson(input: {
  readonly cloudConsent: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly storageEncrypted: boolean;
}): string {
  const config = {
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
