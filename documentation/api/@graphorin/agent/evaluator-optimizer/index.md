[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / evaluator-optimizer

# evaluator-optimizer

`evaluatorOptimizer({...})` - Generator → Evaluator iteration
loop with three rubric kinds and a REQUIRED iteration cap.

Iteration boundary discipline: each iteration is a fresh
agent.run-equivalent boundary. Intra-loop reasoning retention
applies WITHIN one iteration, not ACROSS
iterations. The Generator's iteration-N input is the original
user input + the Evaluator's iteration-(N-1) critique (NOT the
Generator's iteration-(N-1) internal message history).

## Interfaces

| Interface | Description |
| ------ | ------ |
| [EvaluatorOptimizerOptions](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOptimizerOptions.md) | Options accepted by [evaluatorOptimizer](/api/@graphorin/agent/evaluator-optimizer/functions/evaluatorOptimizer.md). `maxIterations` is REQUIRED - the helper asserts `>= 1` at construction time. |
| [EvaluatorOptimizerOutcome](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOptimizerOutcome.md) | Aggregate outcome of an `evaluatorOptimizer({...})` run. |
| [EvaluatorOutcome](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOutcome.md) | Per-iteration evaluation outcome returned by the Evaluator. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [EvaluatorCallable](/api/@graphorin/agent/evaluator-optimizer/type-aliases/EvaluatorCallable.md) | Evaluator callable shape. Receives the original user input + the candidate output and returns the structured outcome. |
| [GeneratorCallable](/api/@graphorin/agent/evaluator-optimizer/type-aliases/GeneratorCallable.md) | Generator callable shape. Receives the original user input plus the previous iteration's critique (or `undefined` on the first iteration) and returns the new candidate output. |
| [Rubric](/api/@graphorin/agent/evaluator-optimizer/type-aliases/Rubric.md) | Rubric discriminator. Pick the variant that matches your Evaluator's contract. |

## Functions

| Function | Description |
| ------ | ------ |
| [evaluatorOptimizer](/api/@graphorin/agent/evaluator-optimizer/functions/evaluatorOptimizer.md) | Run the Generator → Evaluator iteration loop. |
