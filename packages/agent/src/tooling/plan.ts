/**
 * D6 structured plan / todo tool + attention recitation. The tool is a
 * TodoWrite-style status-flip mutation over the agent's own working
 * plan, journaled in `RunState.todos` so it survives suspend/resume.
 * Attention recitation renders the current plan back into the prompt
 * near the context end each turn (request-only, cache-layout-aware) so
 * the model keeps its objective in focus on long runs (Manus todo.md /
 * lost-in-the-middle evidence).
 *
 * The tool lives in `@graphorin/agent` (not `@graphorin/tools`) because
 * it mutates run state: its `execute` writes through a factory-supplied
 * callback into the active `RunState`.
 *
 * @packageDocumentation
 */

import type { TodoItem, Tool } from '@graphorin/core';

/** Stable name of the built-in plan tool. */
export const PLAN_TOOL_NAME = 'update_plan';

const STATUS_VALUES = ['pending', 'in_progress', 'completed'] as const;

interface PlanToolInput {
  readonly todos: ReadonlyArray<{
    readonly id: string;
    readonly content: string;
    readonly status: 'pending' | 'in_progress' | 'completed';
  }>;
}

interface PlanToolOutput {
  readonly count: number;
  readonly completed: number;
}

const planInputSchema = {
  parse: (v: unknown): PlanToolInput => v as PlanToolInput,
  safeParse: (v: unknown) => {
    if (typeof v !== 'object' || v === null || !Array.isArray((v as { todos?: unknown }).todos)) {
      return { success: false as const, error: new Error('expected { todos: TodoItem[] }') };
    }
    const todos = (v as { todos: unknown[] }).todos;
    for (const t of todos) {
      if (
        typeof t !== 'object' ||
        t === null ||
        typeof (t as { id?: unknown }).id !== 'string' ||
        typeof (t as { content?: unknown }).content !== 'string' ||
        !STATUS_VALUES.includes(
          (t as { status?: unknown }).status as (typeof STATUS_VALUES)[number],
        )
      ) {
        return { success: false as const, error: new Error('invalid TodoItem') };
      }
    }
    return { success: true as const, data: v as PlanToolInput };
  },
  toJSON: (): Record<string, unknown> => ({
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: [...STATUS_VALUES] },
          },
          required: ['id', 'content', 'status'],
        },
      },
    },
    required: ['todos'],
  }),
} as unknown as Tool<PlanToolInput, PlanToolOutput>['inputSchema'];

/**
 * Build the plan tool. `applyTodos` writes the validated list into the
 * active RunState (the factory closes over `activeRunState`). Pure
 * read-only-ish: it mutates run bookkeeping, not the outside world, so
 * it is `sideEffectClass: 'read-only'` (never a data-flow sink).
 */
export function createPlanTool(
  applyTodos: (todos: ReadonlyArray<TodoItem>) => void,
): Tool<PlanToolInput, PlanToolOutput> {
  return {
    name: PLAN_TOOL_NAME,
    description:
      'Record or update your working plan as a checklist of todos (TodoWrite-style, full replace). Each item has an id, content, and status (pending | in_progress | completed). Keep exactly ONE item in_progress at a time; mark items completed as you finish them. The plan is journaled and recited back to you each turn - use it to stay on task across a long run.',
    inputSchema: planInputSchema,
    sideEffectClass: 'read-only',
    async execute(input): Promise<PlanToolOutput> {
      const todos: TodoItem[] = input.todos.map((t) => ({
        id: t.id,
        content: t.content,
        status: t.status,
      }));
      applyTodos(todos);
      return {
        count: todos.length,
        completed: todos.filter((t) => t.status === 'completed').length,
      };
    },
  } as Tool<PlanToolInput, PlanToolOutput>;
}

/**
 * Render the attention-recitation block for the current plan. Returns
 * `null` for an empty plan (nothing to recite). The block is appended to
 * the per-step request copy near the END so it rides the last
 * cache anchor and never busts the stable prompt prefix.
 *
 * @stable
 */
export function renderPlanRecitation(todos: ReadonlyArray<TodoItem> | undefined): string | null {
  if (todos === undefined || todos.length === 0) return null;
  const mark = (s: TodoItem['status']): string =>
    s === 'completed' ? '[x]' : s === 'in_progress' ? '[~]' : '[ ]';
  const lines = todos.map((t) => `${mark(t.status)} ${t.content}`);
  return `<plan reminder="stay on task; keep one item in progress">\n${lines.join('\n')}\n</plan>`;
}
