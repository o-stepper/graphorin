/**
 * Skill loader.
 *
 * Implements three-tier progressive disclosure:
 *
 * - **Tier 1** (always): {@link Skill.metadata} - parsed at load
 *   time from the SKILL.md frontmatter.
 * - **Tier 2** (on activation): {@link Skill.body} - the loader
 *   reads the markdown body lazily; subsequent calls return the
 *   cached value.
 * - **Tier 3** (on demand): {@link Skill.resources} - the loader
 *   walks the skill directory lazily; resource bytes are only read
 *   when {@link SkillResource.read} is invoked.
 *
 * The loader supports four sources:
 *
 * - `{ kind: 'folder', path }`        - read SKILL.md from disk.
 * - `{ kind: 'npm-package', ... }`    - install via the supply-chain
 *   helper from `@graphorin/security/supply-chain`, then read.
 * - `{ kind: 'git-repo', ... }`       - shallow-clone via the
 *   supply-chain helper, then read.
 * - `{ kind: 'inline', skill: ... }`  - caller supplies the parsed
 *   payload; the loader only validates the frontmatter. Useful for
 *   tests and bundled defaults.
 *
 * @packageDocumentation
 */

import type { Stats } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

import {
  installSkillFromGit,
  installSkillFromNpm,
  type ResolvedSkillTrustPolicy,
  resolveTrustPolicy,
  type SkillSignatureVerificationResult,
  type SupplyChainPolicy,
  verifySkillSignature,
} from '@graphorin/security/supply-chain';

import {
  InputFilterRequiredError,
  SkillFrontmatterConflictError,
  SkillLoadError,
  SkillRequiredFieldMissingError,
  SkillRuntimeCompatError,
} from '../errors/index.js';
import {
  parseAllowedToolsValue,
  parseFrontmatterYaml,
  parseHandoffInputFilter,
  parseToolsField,
  splitSkillMd,
  type ValidatedFrontmatter,
  validateFrontmatter,
} from '../frontmatter/index.js';
import type {
  FrontmatterDiagnostic,
  FrontmatterValidatorPolicy,
  HandoffInputFilterDeclaration,
  InlineSkillTool,
  Skill,
  SkillMetadata,
  SkillResource,
  SkillSource,
  SkillsTrustLevel,
  SkillToolDeclaration,
  UnknownFieldPolicy,
} from '../types/index.js';

/** Options forwarded to {@link loadSkillFromSource}. */
export interface LoadSkillOptions {
  readonly conflictPolicy?: FrontmatterValidatorPolicy;
  readonly unknownFieldPolicy?: UnknownFieldPolicy;
  readonly runtimeVersion?: string;
  readonly supplyChainPolicy?: SupplyChainPolicy;
  readonly signal?: AbortSignal;
  /** Override the bundled MIME-type guesser for resource files. */
  readonly mediaTypeFor?: (path: string) => string | undefined;
}

/** Aggregate options accepted by {@link loadSkills}. */
export interface LoadSkillsOptions extends LoadSkillOptions {
  /**
   * Fail fast if any source produces a {@link SkillLoadError}. When
   * `false` (default) the loader logs the source path on the
   * diagnostic and continues with the next source.
   */
  readonly throwOnSourceError?: boolean;
}

const SKILL_MANIFEST_FILENAME = 'SKILL.md';

const DEFAULT_MEDIA_TYPES: Readonly<Record<string, string>> = Object.freeze({
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.ts': 'text/typescript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.py': 'text/x-python; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
});

/**
 * Load a single skill from any supported source. The loader runs the
 * full frontmatter validator and resolves the supply-chain trust
 * policy so the returned {@link Skill} is ready to be inserted into a
 * `SkillRegistry`.
 *
 * @stable
 */
export async function loadSkillFromSource(
  source: SkillSource,
  options: LoadSkillOptions = {},
): Promise<Skill> {
  switch (source.kind) {
    case 'folder':
      return loadFromFolder(source.path, source, options);
    case 'inline':
      return loadFromInline(source, options);
    case 'npm-package': {
      const installArgs: Parameters<typeof installSkillFromNpm>[0] = {
        packageName: source.packageName,
      };
      if (source.version !== undefined)
        (installArgs as Mutable<typeof installArgs>).version = source.version;
      if (source.trustLevel !== undefined)
        (installArgs as Mutable<typeof installArgs>).trustLevel = source.trustLevel;
      if (options.supplyChainPolicy !== undefined)
        (installArgs as Mutable<typeof installArgs>).policy = options.supplyChainPolicy;
      if (options.signal !== undefined)
        (installArgs as Mutable<typeof installArgs>).signal = options.signal;
      const status = await installSkillFromNpm(installArgs);
      const installPath = status.installPath;
      if (installPath === undefined) {
        throw new SkillLoadError(
          source.packageName,
          'npm install completed without an install path; cannot continue.',
        );
      }
      const resolved = await locateSkillRoot(installPath, source.packageName);
      return loadFromFolder(resolved, source, options, status.signature);
    }
    case 'git-repo': {
      const installArgs: Parameters<typeof installSkillFromGit>[0] = {
        repoUrl: source.url,
      };
      if (source.ref !== undefined) (installArgs as Mutable<typeof installArgs>).ref = source.ref;
      if (source.trustLevel !== undefined)
        (installArgs as Mutable<typeof installArgs>).trustLevel = source.trustLevel;
      if (options.supplyChainPolicy !== undefined)
        (installArgs as Mutable<typeof installArgs>).policy = options.supplyChainPolicy;
      if (options.signal !== undefined)
        (installArgs as Mutable<typeof installArgs>).signal = options.signal;
      const status = await installSkillFromGit(installArgs);
      const installPath = status.installPath;
      if (installPath === undefined) {
        throw new SkillLoadError(
          source.url,
          'git clone completed without a clone path; cannot continue.',
        );
      }
      const resolved = await locateSkillRoot(installPath, source.url);
      return loadFromFolder(resolved, source, options, status.signature);
    }
    default: {
      const exhaustive: never = source;
      void exhaustive;
      throw new SkillLoadError('<unknown>', 'unsupported skill source.');
    }
  }
}

/**
 * Load multiple skills concurrently. The sources are loaded in parallel and
 * the returned array preserves input order. When `throwOnSourceError === false`
 * (default) a failing source is logged and skipped; otherwise the first
 * rejection propagates out unchanged.
 *
 * @stable
 */
export async function loadSkills(
  sources: ReadonlyArray<SkillSource>,
  options: LoadSkillsOptions = {},
): Promise<ReadonlyArray<Skill>> {
  const { throwOnSourceError = false, ...inner } = options;
  const loaded = await Promise.all(
    sources.map(async (source): Promise<Skill | null> => {
      try {
        return await loadSkillFromSource(source, inner);
      } catch (err) {
        if (throwOnSourceError) throw err;
        // We cannot create a Skill from a failed source, but we want to
        // preserve a structured diagnostic so callers can audit which
        // sources failed without re-running the loader.
        // eslint-disable-next-line no-console
        console.warn(
          `[graphorin/skills] Failed to load source ${describeSource(source)}: ${(err as Error).message}`,
        );
        return null;
      }
    }),
  );
  return Object.freeze(loaded.filter((skill): skill is Skill => skill !== null));
}

async function loadFromInline(
  source: Extract<SkillSource, { kind: 'inline' }>,
  options: LoadSkillOptions,
): Promise<Skill> {
  const trustPolicy = resolveTrustPolicy(
    { kind: 'folder', path: source.skill.basePath ?? '<inline>' },
    'trusted',
  );
  const { metadata, diagnostics, body } = parseAndValidate(source.skill.skillMd, options);
  const resourceList = source.skill.resources ?? [];
  const resources: SkillResource[] = resourceList.map((entry) => {
    const relativePath = entry.path;
    const path =
      source.skill.basePath !== undefined ? join(source.skill.basePath, entry.path) : entry.path;
    const mediaType = options.mediaTypeFor?.(entry.path) ?? guessMediaType(entry.path);
    return Object.freeze({
      path,
      relativePath,
      ...(mediaType === undefined ? {} : { mediaType }),
      async read() {
        return new TextEncoder().encode(entry.content);
      },
      async readText() {
        return entry.content;
      },
    } satisfies SkillResource);
  });
  return buildSkill({
    metadata,
    diagnostics,
    body,
    source,
    trustPolicy,
    ...(source.skill.tools === undefined ? {} : { tools: source.skill.tools }),
    bodyLoader: () => Promise.resolve(body),
    resourceLoader: () => Promise.resolve(resources),
  });
}

async function loadFromFolder(
  folderPath: string,
  source: SkillSource,
  options: LoadSkillOptions,
  precomputedSignature?: SkillSignatureVerificationResult | undefined,
): Promise<Skill> {
  const absolutePath = resolve(folderPath);
  let stats: Stats;
  try {
    stats = await stat(absolutePath);
  } catch (err) {
    throw new SkillLoadError(
      describeSource(source),
      `Could not stat skill directory '${absolutePath}'.`,
      { cause: err },
    );
  }
  if (!stats.isDirectory()) {
    throw new SkillLoadError(
      describeSource(source),
      `Skill source must be a directory; '${absolutePath}' is not.`,
    );
  }
  const manifestPath = join(absolutePath, SKILL_MANIFEST_FILENAME);
  let skillMd: string;
  try {
    skillMd = await readFile(manifestPath, 'utf8');
  } catch (err) {
    throw new SkillLoadError(describeSource(source), `SKILL.md is missing at '${manifestPath}'.`, {
      hint: 'Add a SKILL.md file with a YAML frontmatter block.',
      cause: err,
    });
  }
  const parsed = parseAndValidate(skillMd, options);
  const { diagnostics, body } = parsed;
  // RP-9: trust is granted by the integrator, never the artifact. An operator
  // override on the source wins; absent one, the artifact's self-declared
  // 'trusted'/'trusted-with-scripts' is capped at 'unknown' so a downloaded
  // skill cannot promote itself out of the sandbox + taint-marking. The cap
  // applies to EVERY source kind (mcp-skills-01): npm/git sources previously
  // took the SKILL.md's self-declared level verbatim, and - because the
  // signature trust root allows an inline key in the same SKILL.md - a
  // malicious package could inline its own key, self-sign, declare
  // 'trusted', and load unsandboxed with no operator involvement. The
  // resolved level is written back onto the metadata so every downstream
  // consumer (tool stamping, sandbox tier, inbound sanitization) sees it.
  const operatorTrust = extractTrustLevel(source);
  const effectiveTrust: SkillsTrustLevel =
    operatorTrust ?? capSelfDeclaredTrust(parsed.metadata.graphorinTrustLevel);
  const metadata: SkillMetadata =
    effectiveTrust === parsed.metadata.graphorinTrustLevel
      ? parsed.metadata
      : (Object.freeze({
          ...parsed.metadata,
          graphorinTrustLevel: effectiveTrust,
        }) as SkillMetadata);

  let signature: SkillSignatureVerificationResult | undefined = precomputedSignature;
  if (signature === undefined && metadata.graphorinSignaturePresent) {
    try {
      signature = await verifySkillSignature({
        skillMd,
        ...(options.signal === undefined ? {} : { signal: options.signal }),
      });
    } catch (err) {
      // Surface the signature failure as a diagnostic - the supply-
      // chain installer is the one that decides whether to refuse the
      // install based on the resolved trust policy. The folder loader
      // tolerates an unverifiable signature so operators can iterate
      // on local skills before signing.
      // eslint-disable-next-line no-console
      console.warn(
        `[graphorin/skills] Signature verification of '${metadata.name}' failed: ${(err as Error).message}`,
      );
    }
  }

  const trustPolicy = resolveTrustPolicy(
    source.kind === 'folder'
      ? { kind: 'folder', path: absolutePath }
      : source.kind === 'npm-package'
        ? source.version === undefined
          ? { kind: 'npm-package', packageName: source.packageName }
          : { kind: 'npm-package', packageName: source.packageName, version: source.version }
        : source.kind === 'git-repo'
          ? source.ref === undefined
            ? { kind: 'git-repo', url: source.url }
            : { kind: 'git-repo', url: source.url, ref: source.ref }
          : { kind: 'folder', path: absolutePath },
    coerceForSupplyChain(metadata.graphorinTrustLevel),
  );

  return buildSkill({
    metadata,
    diagnostics,
    body,
    source,
    trustPolicy,
    basePath: absolutePath,
    ...(signature === undefined ? {} : { signature }),
    bodyLoader: () => Promise.resolve(body),
    resourceLoader: async (signal) => listResources(absolutePath, options, signal),
  });
}

async function listResources(
  rootPath: string,
  options: LoadSkillOptions,
  signal?: AbortSignal,
): Promise<ReadonlyArray<SkillResource>> {
  const out: SkillResource[] = [];
  for await (const file of walk(rootPath, signal)) {
    const relativePath = relative(rootPath, file);
    if (relativePath === SKILL_MANIFEST_FILENAME) continue;
    const mediaType = options.mediaTypeFor?.(relativePath) ?? guessMediaType(relativePath);
    out.push(
      Object.freeze({
        path: file,
        relativePath: relativePath.split(sep).join('/'),
        ...(mediaType === undefined ? {} : { mediaType }),
        async read(innerSignal?: AbortSignal): Promise<Uint8Array> {
          const buffer = await readFile(file, {
            ...(innerSignal === undefined ? {} : { signal: innerSignal }),
          });
          return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        },
        async readText(innerSignal?: AbortSignal): Promise<string> {
          return readFile(file, {
            encoding: 'utf8',
            ...(innerSignal === undefined ? {} : { signal: innerSignal }),
          });
        },
      } satisfies SkillResource),
    );
  }
  return Object.freeze(out);
}

async function* walk(root: string, signal?: AbortSignal): AsyncIterable<string> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (signal?.aborted === true) return;
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, signal);
      continue;
    }
    if (entry.isFile()) {
      yield full;
    }
  }
}

async function locateSkillRoot(installPath: string, sourceLabel: string): Promise<string> {
  const direct = join(installPath, SKILL_MANIFEST_FILENAME);
  try {
    await stat(direct);
    return installPath;
  } catch {
    // continue
  }
  // RP-10: npm packages land under `node_modules/<packageName>`. The label is
  // the package name for npm sources; for git it is a URL and this probe
  // simply misses, falling through to the one-level-deep scan below.
  const nodeModulesRoot = join(installPath, 'node_modules', sourceLabel);
  try {
    await stat(join(nodeModulesRoot, SKILL_MANIFEST_FILENAME));
    return nodeModulesRoot;
  } catch {
    // continue
  }
  const entries = await readdir(installPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const child = join(installPath, entry.name, SKILL_MANIFEST_FILENAME);
      try {
        await stat(child);
        return join(installPath, entry.name);
      } catch {
        // continue
      }
    }
  }
  throw new SkillLoadError(
    sourceLabel,
    `Could not locate SKILL.md inside '${installPath}'. Expected at the top-level or one folder deep.`,
  );
}

interface ParsedAndValidated {
  readonly metadata: SkillMetadata;
  readonly diagnostics: ReadonlyArray<FrontmatterDiagnostic>;
  readonly body: string;
}

function parseAndValidate(skillMd: string, options: LoadSkillOptions): ParsedAndValidated {
  const split = splitSkillMd(skillMd);
  const frontmatter = parseFrontmatterYaml(split.frontmatter);
  const validateOptions: Parameters<typeof validateFrontmatter>[1] = {};
  if (options.conflictPolicy !== undefined)
    (validateOptions as Mutable<typeof validateOptions>).conflictPolicy = options.conflictPolicy;
  if (options.unknownFieldPolicy !== undefined)
    (validateOptions as Mutable<typeof validateOptions>).unknownFieldPolicy =
      options.unknownFieldPolicy;
  if (options.runtimeVersion !== undefined)
    (validateOptions as Mutable<typeof validateOptions>).runtimeVersion = options.runtimeVersion;
  const validated = validateFrontmatter(frontmatter, validateOptions);
  for (const diag of validated.diagnostics) {
    if (diag.severity === 'error' && diag.kind === 'missing-required-field') {
      throw new SkillRequiredFieldMissingError(diag.field, {
        ...(diag.hint === undefined ? {} : { hint: diag.hint }),
      });
    }
  }
  const metadata = buildMetadata(validated, frontmatter);
  const diagnostics: FrontmatterDiagnostic[] = [...validated.diagnostics];
  appendUntrustedHandoffDiagnostic(metadata, diagnostics, options.conflictPolicy);
  appendInvalidFieldTypeDiagnostics(frontmatter, validated, diagnostics);
  enforceErrorPolicy(metadata, validated, diagnostics, options);
  return Object.freeze({
    metadata,
    diagnostics: Object.freeze(diagnostics),
    body: split.body,
  });
}

/**
 * RP-11(d): a frontmatter field that is present but unparseable must not be
 * silently dropped (`?? []`). Surface an `invalid-field-type` diagnostic so
 * callers can audit the rejected value, as the parser contracts mandate.
 */
function appendInvalidFieldTypeDiagnostics(
  raw: Record<string, unknown>,
  validated: ValidatedFrontmatter,
  diagnostics: FrontmatterDiagnostic[],
): void {
  const handoffRaw = validated.resolved.handoffInputFilter.value;
  if (handoffRaw !== undefined && parseHandoffInputFilter(handoffRaw) === null) {
    diagnostics.push(
      Object.freeze({
        kind: 'invalid-field-type',
        field: 'handoff-input-filter',
        severity: 'warn',
        message: "'handoff-input-filter' has an unsupported shape; the declaration was ignored.",
        hint: "Use 'lastUser', 'lastN: <n>', 'none', or 'full'.",
      }),
    );
  }
  const toolsRaw = raw['graphorin-tools'];
  if (toolsRaw !== undefined && parseToolsField(toolsRaw) === null) {
    diagnostics.push(
      Object.freeze({
        kind: 'invalid-field-type',
        field: 'graphorin-tools',
        severity: 'warn',
        message: "'graphorin-tools' must be a list of tool declarations; the value was ignored.",
        hint: 'Provide a YAML list, e.g. `graphorin-tools:` with `- name: read_file` entries.',
      }),
    );
  }
}

/**
 * RP-11(b): under `conflictPolicy: 'error'`, an error-severity diagnostic
 * fails the load through the matching typed exception instead of being
 * silently surfaced. Default (`'warn'`) keeps these as diagnostics.
 */
function enforceErrorPolicy(
  metadata: SkillMetadata,
  validated: ValidatedFrontmatter,
  diagnostics: ReadonlyArray<FrontmatterDiagnostic>,
  options: LoadSkillOptions,
): void {
  if (options.conflictPolicy !== 'error') return;
  for (const diag of diagnostics) {
    if (diag.severity !== 'error') continue;
    if (diag.kind === 'invalid-runtime-compat') {
      const declared = validated.resolved.runtimeCompat.value;
      throw new SkillRuntimeCompatError(
        metadata.name,
        typeof declared === 'string' ? declared : String(declared),
        options.runtimeVersion ?? '<unknown>',
        diag.hint === undefined ? undefined : { hint: diag.hint },
      );
    }
    if (diag.kind === 'conflict') {
      throw new SkillFrontmatterConflictError(
        metadata.name,
        diag.field,
        [diag.field],
        diag.hint === undefined ? undefined : { hint: diag.hint },
      );
    }
  }
}

function buildMetadata(
  validated: ValidatedFrontmatter,
  raw: Record<string, unknown>,
): SkillMetadata {
  const name = String(validated.resolved.name.value ?? '').trim();
  const description = String(validated.resolved.description.value ?? '').trim();
  const allowedToolsRaw = validated.resolved.allowedTools.value;
  const allowedTools =
    allowedToolsRaw === undefined ? undefined : parseAllowedToolsValue(allowedToolsRaw);
  const handoffFilter =
    validated.resolved.handoffInputFilter.value === undefined
      ? undefined
      : parseHandoffInputFilter(validated.resolved.handoffInputFilter.value);
  const trustLevelRaw = validated.resolved.trustLevel.value;
  // Phase 08 § "Frontmatter validator" recognises four explicit trust
  // levels: 'trusted' | 'trusted-with-scripts' | 'unknown' |
  // 'untrusted'. A skill that did not declare the field is treated as
  // 'unknown' (sandbox forced; signature optional) - that is the
  // default-deny posture per DEC-148 risk mitigation.
  const trustLevel: SkillsTrustLevel = (() => {
    if (
      trustLevelRaw === 'trusted' ||
      trustLevelRaw === 'trusted-with-scripts' ||
      trustLevelRaw === 'untrusted' ||
      trustLevelRaw === 'unknown'
    ) {
      return trustLevelRaw;
    }
    return 'unknown';
  })();
  const sandbox = validated.resolved.sandbox.value;
  const sensitivity = validated.resolved.sensitivity.value;
  const sensitivityDefaultsRaw = validated.resolved.sensitivityDefaults.value;
  const sensitivityDefaults =
    sensitivityDefaultsRaw !== null && typeof sensitivityDefaultsRaw === 'object'
      ? Object.freeze({ ...(sensitivityDefaultsRaw as Record<string, string>) })
      : undefined;
  const metadataObj = validated.resolved.metadata.value;
  const metadataValue =
    metadataObj !== null && typeof metadataObj === 'object'
      ? Object.freeze({ ...(metadataObj as Record<string, unknown>) })
      : undefined;
  const result: Mutable<SkillMetadata> = {
    name,
    description,
    disableModelInvocation: validated.resolved.disableModelInvocation.value === true,
    graphorinTrustLevel: trustLevel,
    graphorinSignaturePresent: 'graphorin-signature' in raw,
    raw: Object.freeze({ ...raw }),
  };
  if (typeof validated.resolved.license.value === 'string')
    result.license = validated.resolved.license.value;
  if (typeof validated.resolved.compatibility.value === 'string')
    result.compatibility = validated.resolved.compatibility.value;
  if (metadataValue !== undefined) result.metadata = metadataValue;
  if (allowedTools !== undefined && allowedTools !== null)
    result.allowedTools = Object.freeze([...allowedTools]);
  if (typeof validated.resolved.runtimeCompat.value === 'string')
    result.graphorinRuntimeCompat = validated.resolved.runtimeCompat.value;
  if (typeof sensitivity === 'string') result.graphorinSensitivity = sensitivity;
  if (sensitivityDefaults !== undefined) result.graphorinSensitivityDefaults = sensitivityDefaults;
  if (sandbox !== null && typeof sandbox === 'object')
    result.graphorinSandbox = Object.freeze({ ...(sandbox as Record<string, unknown>) });
  if (handoffFilter !== undefined && handoffFilter !== null)
    result.graphorinHandoffInputFilter = handoffFilter;
  if (typeof validated.resolved.anthropicSpec.value === 'string')
    result.graphorinAnthropicSpec = validated.resolved.anthropicSpec.value;
  if (typeof validated.resolved.version.value === 'string')
    result.graphorinVersion = validated.resolved.version.value;
  return Object.freeze(result) as SkillMetadata;
}

function appendUntrustedHandoffDiagnostic(
  metadata: SkillMetadata,
  diagnostics: FrontmatterDiagnostic[],
  conflictPolicy: FrontmatterValidatorPolicy = 'warn',
): void {
  // Untrusted skills that declared `filter: full` are an explicit
  // attempt to exfiltrate the entire conversation through a sub-agent
  // - Phase 08 / ADR-040 mandate that we WARN and ignore. The agent
  // runtime in Phase 12 will refuse the filter regardless of this
  // diagnostic.
  if (metadata.graphorinTrustLevel === 'untrusted') {
    if (metadata.graphorinHandoffInputFilter?.kind === 'full') {
      diagnostics.push(
        Object.freeze({
          kind: 'untrusted-handoff-filter-required',
          field: 'graphorin-handoff-input-filter',
          severity: 'warn',
          message: `Untrusted skill '${metadata.name}' declared 'graphorin-handoff-input-filter: full'. The full-message filter is rejected for untrusted skills; the runtime will fall back to 'lastUser'.`,
          hint: "Replace 'full' with 'lastUser' (or another bounded filter) to silence this diagnostic.",
        }),
      );
    } else if (metadata.graphorinHandoffInputFilter === undefined) {
      diagnostics.push(
        Object.freeze({
          kind: 'untrusted-handoff-filter-required',
          field: 'graphorin-handoff-input-filter',
          severity: conflictPolicy === 'error' ? 'error' : 'warn',
          message: `Untrusted skill '${metadata.name}' did not declare 'graphorin-handoff-input-filter'. The runtime will throw if the skill invokes Agent.toTool()/handoff().`,
          hint: "Add 'graphorin-handoff-input-filter: lastUser' to the SKILL.md frontmatter.",
        }),
      );
    }
  }
}

interface BuildSkillArgs {
  readonly metadata: SkillMetadata;
  readonly diagnostics: ReadonlyArray<FrontmatterDiagnostic>;
  readonly body: string;
  readonly source: SkillSource;
  readonly trustPolicy: ResolvedSkillTrustPolicy;
  readonly basePath?: string;
  readonly signature?: SkillSignatureVerificationResult;
  readonly tools?: ReadonlyArray<InlineSkillTool>;
  readonly bodyLoader: () => Promise<string>;
  readonly resourceLoader: (signal?: AbortSignal) => Promise<ReadonlyArray<SkillResource>>;
}

function buildSkill(args: BuildSkillArgs): Skill {
  let bodyCache: string | null = null;
  let resourcesCache: ReadonlyArray<SkillResource> | null = null;
  let bodyPromise: Promise<string> | null = null;
  let resourcesPromise: Promise<ReadonlyArray<SkillResource>> | null = null;
  const toolDeclarations = parseToolsField(args.metadata.raw['graphorin-tools']) ?? [];
  const tools = Object.freeze([...(args.tools ?? [])]);
  return Object.freeze({
    metadata: args.metadata,
    source: args.source,
    ...(args.basePath === undefined ? {} : { basePath: args.basePath }),
    trustPolicy: args.trustPolicy,
    ...(args.signature === undefined ? {} : { signature: args.signature }),
    async body(_signal?: AbortSignal): Promise<string> {
      if (bodyCache !== null) return bodyCache;
      if (bodyPromise === null) {
        bodyPromise = args.bodyLoader().then((value) => {
          bodyCache = value;
          return value;
        });
      }
      return bodyPromise;
    },
    async resources(signal?: AbortSignal): Promise<ReadonlyArray<SkillResource>> {
      if (resourcesCache !== null) return resourcesCache;
      if (resourcesPromise === null) {
        resourcesPromise = args.resourceLoader(signal).then((value) => {
          resourcesCache = value;
          return value;
        });
      }
      return resourcesPromise;
    },
    tools(): ReadonlyArray<InlineSkillTool> {
      return tools;
    },
    toolDeclarations(): ReadonlyArray<SkillToolDeclaration> {
      return toolDeclarations;
    },
    diagnostics(): ReadonlyArray<FrontmatterDiagnostic> {
      return args.diagnostics;
    },
  } satisfies Skill);
}

function describeSource(source: SkillSource): string {
  switch (source.kind) {
    case 'folder':
      return `folder:${source.path}`;
    case 'npm-package':
      return source.version === undefined
        ? `npm:${source.packageName}`
        : `npm:${source.packageName}@${source.version}`;
    case 'git-repo':
      return source.ref === undefined ? `git:${source.url}` : `git:${source.url}@${source.ref}`;
    case 'inline':
      return 'inline';
    default: {
      const exhaustive: never = source;
      void exhaustive;
      return 'unknown';
    }
  }
}

function extractTrustLevel(source: SkillSource): SkillsTrustLevel | undefined {
  if (source.kind === 'npm-package' || source.kind === 'git-repo' || source.kind === 'folder')
    return source.trustLevel;
  return undefined;
}

/**
 * Cap a folder skill's self-declared trust level. A directory on disk -
 * possibly downloaded from the internet - cannot self-promote to a trusted
 * tier without an operator override (RP-9): `trusted` /
 * `trusted-with-scripts` collapse to `'unknown'` (sandbox forced, signature
 * optional, outputs taint-marked), while `untrusted` / `unknown` pass
 * through unchanged.
 */
function capSelfDeclaredTrust(level: SkillsTrustLevel): SkillsTrustLevel {
  return level === 'trusted' || level === 'trusted-with-scripts' ? 'unknown' : level;
}

/**
 * Translate the loader's four-valued trust level into the three-
 * valued trust level the supply-chain installer expects.
 *
 * The 'unknown' value collapses to 'untrusted' so the supply-chain
 * resolver picks the strict signature + `--ignore-scripts` policy.
 * The loader keeps the original 'unknown' on the skill's metadata
 * record so the runtime sandbox tier resolver continues to apply
 * the correct policy.
 */
function coerceForSupplyChain(
  level: SkillsTrustLevel,
): 'trusted' | 'trusted-with-scripts' | 'untrusted' {
  if (level === 'unknown') return 'untrusted';
  return level;
}

function guessMediaType(path: string): string | undefined {
  const ext = extname(path).toLowerCase();
  return DEFAULT_MEDIA_TYPES[ext];
}

/**
 * Required handoff-filter declaration helper. Returns the typed
 * declaration the loader parsed from frontmatter; throws
 * {@link InputFilterRequiredError} when the skill is untrusted and the
 * field is missing. Used by the agent runtime in Phase 12 right
 * before instantiating an untrusted skill's sub-agent.
 *
 * @stable
 */
export function requireHandoffInputFilter(metadata: SkillMetadata): HandoffInputFilterDeclaration {
  if (metadata.graphorinHandoffInputFilter !== undefined) {
    if (
      metadata.graphorinTrustLevel === 'untrusted' &&
      metadata.graphorinHandoffInputFilter.kind === 'full'
    ) {
      // ADR-040: `full` is rejected for untrusted skills regardless
      // of declaration. Fall back to the bounded default.
      return Object.freeze({ kind: 'lastUser' });
    }
    return metadata.graphorinHandoffInputFilter;
  }
  if (metadata.graphorinTrustLevel === 'untrusted') {
    throw new InputFilterRequiredError(metadata.name);
  }
  // `'unknown'` skills require an explicit declaration too - default-
  // deny posture per Phase 08. Trusted skills inherit the framework's
  // bounded `lastN(10)` default.
  if (metadata.graphorinTrustLevel === 'unknown') {
    throw new InputFilterRequiredError(metadata.name);
  }
  return Object.freeze({ kind: 'lastN', n: 10 });
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
