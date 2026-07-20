[**Graphorin API reference v0.13.6**](../../../index.md)

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

**Timezones.** By default the scheduler evaluates every
expression in **UTC**. `nextFireAfter(parsed, from, timeZone)`
accepts an optional IANA zone name; the five fields then match the
wall clock of that zone and the returned `Date` is the corresponding
UTC instant. DST transitions follow Vixie cron semantics:

- **Fixed-time jobs** (neither the minute nor the hour field covers
  its full range): a wall time swallowed by a spring-forward gap
  runs once immediately after the transition; a wall time repeated
  by a fall-back overlap runs only on the first pass.
- **Wildcard jobs** (the minute or the hour field covers its full
  range, e.g. `*` or `0-59`): no compensation - the job simply
  follows the new wall clock, so gap times never run and repeated
  times run on both passes.

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
| [isValidTimeZone](/api/@graphorin/triggers/cron/functions/isValidTimeZone.md) | `true` when `timeZone` is an IANA zone name this runtime's Intl data resolves. The `cron(...)` helper uses it for eager validation so a typo fails at registration time, never at first fire. |
| [nextFireAfter](/api/@graphorin/triggers/cron/functions/nextFireAfter.md) | Compute the next fire time strictly after `from` for the supplied cron schedule. Returns a UTC `Date`. |
| [parseCron](/api/@graphorin/triggers/cron/functions/parseCron.md) | Parse a 5-field cron expression. Throws [CronParseError](/api/@graphorin/triggers/cron/classes/CronParseError.md) on any malformed input. |
