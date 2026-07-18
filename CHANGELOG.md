# Changelog

## 2026-07-18

### Added

- Added a Skill-to-Loop Upgrade workflow that assesses an existing Agent Skill
  for loopability, returns a structured decision record, and performs only an
  explicitly approved upgrade while preserving the complete Skill package.
- Added architecture outcomes for keeping a Skill non-looping, embedding a
  bounded Loop, upgrading to a loop-first Skill, or splitting independent
  feedback cycles.

### Changed

- Clarified that compact Loop Library prompts are optional derivatives of an
  independently reusable Loop, not replacements for an upgraded Agent Skill.

## 2026-07-03

### Added

- Added Loopy's project loop save/reuse workflow. On request, Loopy can append
  an accepted loop to `LOOPS.md`, reuse saved project loops in later sessions,
  and warn when a saved adaptation's published source has changed.

### Security

- Documented that `LOOPS.md` is untrusted reference data and that Loopy must
  refuse to save prompts containing secrets until the user provides a sanitized
  version.
