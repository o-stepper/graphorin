---
"@graphorin/cli": patch
---

fix(cli): TOOL-AUDI-02 audit export enforces mode 0600 on a pre-existing file

`graphorin audit export` printed "(mode 0600)" but `writeFile`'s `mode` only
applies when it creates the file - re-exporting over an existing world-readable
file left it at its old mode. The command now `chmod`s the target to 0600 after
every write (a no-op on Windows, which has no POSIX mode bits).
