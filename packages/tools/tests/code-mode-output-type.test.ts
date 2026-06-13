/**
 * A5: structured tool output end-to-end. `code_search` projects each tool as a
 * `tools.NAME(input: …): Promise<…>` signature so the model writes correct code,
 * but the return was hardcoded `Promise<unknown>`. With a tool `outputSchema`,
 * render the real return type — the model now knows what each tool returns and
 * can chain calls. Groundwork for typed code-mode (E1) and field-level previews.
 */

import { describe, expect, it } from 'vitest';
import { projectToolApi } from '../src/code-mode/index.js';

describe('A5: code-mode signatures render the output type from outputSchema', () => {
  it('renders Promise<output-type> instead of Promise<unknown>', () => {
    const proj = projectToolApi([
      {
        name: 'fact_remember',
        description: 'Store a fact.',
        inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
        outputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    ]);
    expect(proj.signatureFor('fact_remember')).toContain('Promise<{ "id": string }>');
  });

  it('falls back to Promise<unknown> when no outputSchema is declared', () => {
    const proj = projectToolApi([{ name: 'ping', inputSchema: { type: 'object' } }]);
    expect(proj.signatureFor('ping')).toContain('Promise<unknown>');
  });
});
