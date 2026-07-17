---
"@graphorin/tools": patch
---

docs(tools): TOOLS-EX-02 correct the imperative-scan budget default in docstrings

`SanitizationOptions.budgetMs` and `ExecutorOptions.imperativeBudgetMs` documented
a `5` ms default, but the effective default is `250` ms (a 5 ms budget is too
tight on cold/loaded runners and would skip the strip pass, letting injection
through). The docstrings now match the code; behaviour is unchanged.
