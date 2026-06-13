import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * RP-2 — `@graphorin/agent` does not import `@graphorin/sessions` anywhere (the
 * sessions↔agent bridge is wired by the operator, not the runtime). Declaring
 * it as a dependency was a phantom edge; this guards against it returning.
 */
describe('RP-2 — no phantom @graphorin/sessions dependency', () => {
  it('agent package.json does not declare @graphorin/sessions', () => {
    const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.['@graphorin/sessions']).toBeUndefined();
    expect(pkg.devDependencies?.['@graphorin/sessions']).toBeUndefined();
    expect(pkg.peerDependencies?.['@graphorin/sessions']).toBeUndefined();
  });
});
