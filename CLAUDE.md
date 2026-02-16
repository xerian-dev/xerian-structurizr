# Project Conventions

## Branch Naming

Use one of these prefixes followed by a kebab-case description:

- `feature/<short-description>` — new functionality
- `bugfix/<short-description>` — bug fixes
- `refactor/<short-description>` — code restructuring without behavior changes
- `admin/<short-description>` — tooling, CI, docs, config changes

The short description may optionally include an issue number (e.g., `feature/42-live-preview`).

## Pull Requests

- All changes go through feature branches and PRs (no direct commits to main)
- If there is a related GitHub issue, reference it in the PR description
