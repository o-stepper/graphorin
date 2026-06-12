---
'@graphorin/security': patch
---

fix(security): Windows browser launcher avoids cmd.exe re-parse + validates the URL (SPL-18)

The OAuth browser launcher built `cmd /c start "" <url>` on Windows with a
URL ultimately derived from fetched discovery metadata. `cmd.exe`
re-parses its command line and `start` re-parses again, so shell
metacharacters (`&` / `|` / `^`) in a malicious/MITM'd endpoint could break
out of the argument and run extra commands.

- The win32 launcher now uses `rundll32 url.dll,FileProtocolHandler <url>`
  — the URL is handed to the shell's URL handler with no cmd re-parse.
- `assertSafeLaunchUrl` rejects non-http(s) schemes and any URL carrying
  shell metacharacters before it reaches a launcher (all platforms),
  reinforcing SPL-7's discovery validation.
