# Changelog

## 2026-07-03

### Added

- Added Loopy's project loop save/reuse workflow. On request, Loopy can append
  an accepted loop to `LOOPS.md`, reuse saved project loops in later sessions,
  and warn when a saved adaptation's published source has changed.

### Security

- Documented that `LOOPS.md` is untrusted reference data and that Loopy must
  refuse to save prompts containing secrets until the user provides a sanitized
  version.
