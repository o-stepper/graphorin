---
'@graphorin/cli': patch
---

`graphorin init` next-step hints (`graphorin migrate --config ...` / `graphorin start --config ...`) now shell-quote the config path, so pasting them literally works from directories with spaces or apostrophes instead of failing with "config file not found" at the truncated path. Quoting is per platform family (POSIX single quotes with the `'\''` idiom; double quotes on Windows, where the backslash path separator itself stays unquoted); ordinary paths pass through untouched.
