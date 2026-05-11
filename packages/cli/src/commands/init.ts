/**
 * `graphorin init` — interactive bootstrap.
 *
 * Writes a fresh `graphorin.config.ts` to the current working
 * directory (or `--out`), prompts the operator for the cloud-upload
 * sensitivity tier + storage encryption opt-in, and prints exactly
 * one bootstrap admin token (held by the operator from this point
 * onward — the tool never persists nor logs the raw value).
 *
 * `--non-interactive` accepts every choice through flags or env vars
 * so the command works equally well in CI / image-build pipelines.
 *
 * @packageDocumentation
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import process from 'node:process';

import { generatePepper, generateRawToken } from '@graphorin/security';

import { confirm, select } from '../internal/prompts.js';

/**
 * @stable
 */
export interface InitCommandOptions {
  readonly out?: string;
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
  readonly bootstrapToken: string;
  readonly serverPepperHex: string;
  readonly cloudConsent: 'public-only' | 'public-and-internal' | 'all-with-warnings';
  readonly storageEncrypted: boolean;
}

/**
 * @stable
 */
export async function runInit(options: InitCommandOptions = {}): Promise<InitCommandResult> {
  const cwd = options.cwd ?? process.cwd();
  const target = resolveOutPath(cwd, options.out);
  const print = options.print ?? ((line: string) => process.stderr.write(`${line}\n`));

  const cloudConsent = await resolveCloudConsent(options);
  const storageEncrypted = await resolveEncryption(options);

  const pepper = generatePepper();
  const pepperHex = await pepper.useBuffer((buf) => buf.toString('hex'));

  const bootstrap = generateRawToken({ env: 'live' });

  if (options.dryRun !== true) {
    if (await fileExists(target)) {
      throw new Error(
        `[graphorin/cli] refusing to overwrite existing '${target}'. Move it aside or pass --out <path>.`,
      );
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, renderConfig({ cloudConsent, storageEncrypted }), { mode: 0o600 });
  }

  print(`[graphorin/cli] wrote ${target}`);
  print(`[graphorin/cli] bootstrap admin token (shown ONCE):`);
  print(`  ${bootstrap.raw}`);
  print(`[graphorin/cli] server pepper hex (store in your keyring as 'graphorin_server_pepper'):`);
  print(`  ${pepperHex}`);
  print('');
  print('Next steps:');
  print(
    `  1. Persist the pepper: graphorin secrets set graphorin_server_pepper=${pepperHex}  (Phase 15)`,
  );
  print(`  2. Persist the bootstrap token securely; do NOT commit it.`);
  print(`  3. Run \`graphorin migrate --config ${target}\` to apply storage migrations.`);
  print(`  4. Run \`graphorin start --config ${target}\` to launch the server.`);

  return Object.freeze({
    configPath: target,
    bootstrapToken: bootstrap.raw,
    serverPepperHex: pepperHex,
    cloudConsent,
    storageEncrypted,
  });
}

function resolveOutPath(cwd: string, out: string | undefined): string {
  if (out === undefined || out.length === 0) return resolve(cwd, 'graphorin.config.ts');
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
  // First-run sensitivity tier per DEC-018 / DEC-126 — referenced by the
  // memory + tools layers when deciding what context is allowed to leave
  // the local process.
  // @ts-expect-error — defaults block is forward-compatible for v0.1+.
  defaults: {
    sensitivity: {
      cloudUploadConsent: ${JSON.stringify(input.cloudConsent)},
    },
  },
});
`;
}
