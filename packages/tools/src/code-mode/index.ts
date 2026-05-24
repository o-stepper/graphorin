/**
 * Code-mode / programmatic tool calling (P1-2). Public surface:
 *
 * - {@link projectToolApi} — project a resolved tool set as a typed code
 *   API (catalogue + per-tool signatures).
 * - {@link createCodeExecuteTool} / {@link createCodeSearchTool} — the two
 *   Graphorin-named meta-tools the agent advertises in code-mode.
 *
 * The sandbox primitive these build on, `runBridgedSource`, lives in
 * `@graphorin/security/sandbox` (sandbox isolation is a security
 * concern); this module supplies the tool bridge + the model-facing
 * projection. The agent runtime wires them behind the opt-in
 * `toolInvocation: 'code-mode'` config.
 *
 * @packageDocumentation
 */

export {
  type CodeExecuteBridge,
  type CodeExecuteLimits,
  type CodeExecuteToolOptions,
  type CodeSearchMatch,
  type CodeSearchToolOptions,
  createCodeExecuteTool,
  createCodeSearchTool,
} from './meta-tools.js';
export {
  type CodeApiProjection,
  type ProjectableTool,
  projectToolApi,
} from './project.js';
