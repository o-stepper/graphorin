/**
 * Tiny wrapper around `readline` for interactive prompts. Avoids the
 * `enquirer` peer dependency for the minimal Phase 14a surface.
 *
 * @internal
 */

import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

/**
 * @internal
 */
export async function ask(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const suffix = defaultValue !== undefined ? ` (${defaultValue})` : '';
    const answer = await rl.question(`${question}${suffix} `);
    if (answer.length === 0 && defaultValue !== undefined) return defaultValue;
    return answer;
  } finally {
    rl.close();
  }
}

/**
 * @internal
 */
export async function confirm(question: string, defaultValue: boolean): Promise<boolean> {
  const answer = await ask(
    `${question} [${defaultValue ? 'Y/n' : 'y/N'}]`,
    defaultValue ? 'y' : 'n',
  );
  const normalized = answer.trim().toLowerCase();
  if (normalized.length === 0) return defaultValue;
  return normalized === 'y' || normalized === 'yes';
}

/**
 * @internal
 */
export async function select(
  question: string,
  options: ReadonlyArray<string>,
  defaultValue: string,
): Promise<string> {
  const numbered = options.map(
    (opt, idx) => `  ${idx + 1}. ${opt}${opt === defaultValue ? ' (default)' : ''}`,
  );
  const answer = await ask(`${question}\n${numbered.join('\n')}\n>`, defaultValue);
  const trimmed = answer.trim();
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num) && num >= 1 && num <= options.length) {
    return options[num - 1] as string;
  }
  if (options.includes(trimmed)) return trimmed;
  return defaultValue;
}
