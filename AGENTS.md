# Repository agent instructions

## GitHub access

- Run GitHub CLI commands that need network access in unsandboxed mode. GitHub
  authentication and connectivity may fail inside the sandbox even when the
  existing `gh` login works outside it.
- Prefer the task-specific `gh` commands (`gh issue`, `gh pr`, and so on) for
  GitHub workflows.
