/**
 * Barrel export for every shipped reporter. Each renderer takes an
 * `EvalReport` and returns the canonical text representation; the
 * caller decides where to write it (`writeFile`, `process.stdout`,
 * GitHub Actions step summary, etc.).
 *
 * @packageDocumentation
 */

export { renderHtmlReport } from './html.js';
export { renderJsonReport } from './json.js';
export { renderJunitReport } from './junit.js';
export { renderMarkdownReport } from './markdown.js';
export { renderTerminalReport } from './terminal.js';
