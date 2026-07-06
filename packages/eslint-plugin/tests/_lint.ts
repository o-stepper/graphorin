/**
 * Tiny helper around ESLint's `Linter` so the rule tests can lint a
 * source string end-to-end without spinning up a full project config.
 *
 * The wrapper hides ESLint flat-config's strict file matching: the
 * `Linter` constructor takes a `cwd` that becomes the prefix for the
 * `files` glob match. We compute a `cwd` from the supplied filename
 * so any absolute path "just works".
 */

import { dirname } from 'node:path';

import { Linter } from 'eslint';

import plugin from '../src/index.js';

export function lintSource(args: {
  source: string;
  rule: keyof typeof plugin.rules;
  filename?: string;
  severity?: 'error' | 'warn';
  /** Rule options array (the part after the severity in a config entry). */
  options?: readonly unknown[];
}): Linter.LintMessage[] {
  const filename = args.filename ?? '/repo/packages/example/src/example.js';
  const linter = new Linter({ cwd: dirname(filename) });
  const entry: Linter.RuleEntry =
    args.options !== undefined
      ? ([args.severity ?? 'error', ...args.options] as Linter.RuleEntry)
      : (args.severity ?? 'error');
  const config: Linter.Config[] = [
    {
      files: ['**/*.js'],
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
      },
      plugins: { '@graphorin': plugin as never },
      rules: { [`@graphorin/${String(args.rule)}`]: entry },
    },
  ];
  const messages = linter.verify(args.source, config, filename);
  return messages;
}
