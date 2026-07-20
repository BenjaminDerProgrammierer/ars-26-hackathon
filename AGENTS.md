# Repository agent instructions

## GitHub access

- Run GitHub CLI commands that need network access in unsandboxed mode. GitHub
  authentication and connectivity may fail inside the sandbox even when the
  existing `gh` login works outside it.
- Prefer the task-specific `gh` commands (`gh issue`, `gh pr`, and so on) for
  GitHub workflows.
- In this repository, "approve a PR" means posting an approval comment and then
  rebase-merging the PR. Do not use GitHub's review/approval flow.

## Azure access

- Always run Azure CLI (`az`) commands in unsandboxed mode. The CLI installation,
  authentication state, and network access are available in the host environment,
  not reliably inside the sandbox.
- You can assume that `az` is configured and authenticated to an Azure subscription
  that you can work with.
- Use the `ArsElectronicaHackathon` resource group for Azure resources created or
  managed for this repository.
- Always use the `austriaeast` Azure region for regional resources.

## Documentation

Use the `microsoft-docs` skill to retrieve up-to-date documentation about Microsoft-realted topics including Microsoft Azure. Do not use the MCP server, use the CLI variant.

For all non-Microsoft related topics, use context7 (`find-docs` skill). Also use the CLI, not the MCP server.
