[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / cron

# cron

Tiny in-tree 5-field cron parser used by `@graphorin/triggers`.

Supported syntax:

  minute   (0-59)
  hour     (0-23)
  day      (1-31)
  month    (1-12)
  dayOfWeek (0-6; Sunday = 0)

Each field accepts:
  - star (asterisk) for every value
  - a single number `5`
  - a comma list `1,2,5`
  - a range `1-4`
  - a step expression with the slash operator (e.g. every-5 minutes,
    `0-30/10` for "0,10,20,30 minutes")

The parser is intentionally **strict**: any unrecognised character
raises [CronParseError](/api/@graphorin/triggers/cron/classes/CronParseError.md) so a typo never silently never-fires.

**Day vs. day-of-week semantics - AND, not OR.** When *both* `day`
and `dayOfWeek` are restricted (neither is the every-value
wildcard), Graphorin requires **both** to match for a fire to
happen - i.e. `0 12 1-7 * 1` means "noon on the first Monday of
every month". This differs from Vixie / POSIX cron, which
OR-combines the two restricted fields. AND semantics are easier to
reason about in personal-assistant scenarios; the framework stays
consistent with this rule rather than mixing the two conventions.

The scheduler treats every trigger as **UTC**. Operators that need
a local-time fire encode the offset directly into their cron
expression (e.g. `0 14 * * *` for "9am Eastern in winter").

## Classes

| Class | Description |
| ------ | ------ |
| [CronParseError](/api/@graphorin/triggers/cron/classes/CronParseError.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ParsedCron](/api/@graphorin/triggers/cron/interfaces/ParsedCron.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [nextFireAfter](/api/@graphorin/triggers/cron/functions/nextFireAfter.md) | Compute the next fire time strictly after `from` for the supplied cron schedule. Returns a UTC `Date` (the scheduler treats every trigger as UTC; operators that need local time express that in their cron expression). |
| [parseCron](/api/@graphorin/triggers/cron/functions/parseCron.md) | Parse a 5-field cron expression. Throws [CronParseError](/api/@graphorin/triggers/cron/classes/CronParseError.md) on any malformed input. |
