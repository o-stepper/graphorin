/**
 * Tiny config loader. Resolves the path the operator handed in (or
 * the per-platform default) and returns the raw {@link ServerConfigInput}
 * payload - strict validation happens later via
 * `parseServerConfig(...)` from `@graphorin/server`.
 *
 * Supported file kinds (decided by extension):
 *
 *  - `*.ts`  / `*.mts` / `*.cts` - re-imported through the platform
 *    loader; relies on Node's native TS support (or a registered
 *    loader) - Phase 14a leaves the operator to wire `tsx`, `ts-node`,
 *    or whatever they prefer when shipping a `.ts` config.
 *  - `*.js`  / `*.mjs`           - dynamic `import()`.
 *  - `*.json`                     - `readFile` + `JSON.parse`.
 *
 * The file is expected to default-export an object built via
 * `defineConfig({...})`.
 *
 * @internal
 */

import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ServerConfigInput } from '@graphorin/server';

/**
 * @stable
 */
export interface LoadConfigOptions {
  /** Override the resolved process.cwd(). Tests inject a fixture root. */
  readonly cwd?: string;
}

/**
 * @stable
 */
export interface LoadedConfig {
  readonly path: string;
  readonly config: ServerConfigInput;
}

const DEFAULT_FILENAMES: ReadonlyArray<string> = Object.freeze([
  'graphorin.config.ts',
  'graphorin.config.mjs',
  'graphorin.config.js',
  'graphorin.config.json',
]);

/**
 * Resolve the path the operator passed (or pick the first existing
 * default in `cwd`) and parse the config it exports.
 *
 * @stable
 */
export async function loadConfig(
  pathArg: string | undefined,
  options: LoadConfigOptions = {},
): Promise<LoadedConfig> {
  const cwd = options.cwd ?? process.cwd();
  let absolute: string;
  if (pathArg !== undefined && pathArg.length > 0) {
    absolute = isAbsolute(pathArg) ? pathArg : resolve(cwd, pathArg);
    await assertExists(absolute);
  } else {
    absolute = await firstExistingDefault(cwd);
  }
  const config = await importConfig(absolute);
  return Object.freeze({ path: absolute, config });
}

async function firstExistingDefault(cwd: string): Promise<string> {
  for (const name of DEFAULT_FILENAMES) {
    const candidate = resolve(cwd, name);
    try {
      await stat(candidate);
      return candidate;
    } catch {}
  }
  throw new Error(
    `[graphorin/cli] no config file found in '${cwd}'. Looked for: ${DEFAULT_FILENAMES.join(', ')}.`,
  );
}

async function assertExists(path: string): Promise<void> {
  try {
    await stat(path);
  } catch (err) {
    throw new Error(`[graphorin/cli] config file '${path}' not found.`, { cause: err });
  }
}

async function importConfig(path: string): Promise<ServerConfigInput> {
  if (path.endsWith('.json')) {
    const raw = await readFile(path, 'utf8');
    try {
      return JSON.parse(raw) as ServerConfigInput;
    } catch (err) {
      throw new Error(`[graphorin/cli] config '${path}' is not valid JSON.`, { cause: err });
    }
  }
  const url = pathToFileURL(path).href;
  const mod = (await import(url)) as { default?: unknown };
  if (mod.default !== undefined) return mod.default as ServerConfigInput;
  return mod as unknown as ServerConfigInput;
}
