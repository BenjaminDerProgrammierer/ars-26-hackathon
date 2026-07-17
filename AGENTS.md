# Repository agent instructions

## GitHub access

- Run GitHub CLI commands that need network access in unsandboxed mode. GitHub
  authentication and connectivity may fail inside the sandbox even when the
  existing `gh` login works outside it.
- Prefer the task-specific `gh` commands (`gh issue`, `gh pr`, and so on) for
  GitHub workflows.

## Azure access

You can assume that the `az` CLI is configured and connected to an Azure subscription that you can work with.

## Documentation

Use the `microsoft-docs` skill to retrieve up-to-date documentation about Microsoft-realted topics including Microsoft Azure. Do not use the MCP server, use the CLI variant.

For all non-Microsoft related topics, use context7 (`find-docs` skill). Also use the CLI, not the MCP server.
