# OpenRouter Key Manager

An unprotected TypeScript and Express admin dashboard for managing participant
API keys in the Hackathon OpenRouter workspace. Every newly created key is
automatically assigned to the existing `hackathon member` guardrail.

## Run locally

```sh
pnpm install
cp .env.example .env
# Add your OpenRouter management key to .env
pnpm dev
```

Open <http://localhost:3000>.

## Dashboard capabilities

- List and search all active and disabled keys in the Hackathon workspace.
- Create one key or up to 100 keys at once, returning plaintext values once.
- Automatically assign every newly created key to a pre-defined guardrail.
- Edit limits and names, quickly disable, or delete individual keys.
- Bulk update, quickly disable, and bulk delete selected keys.
- Always exclude BYOK usage from key limits (`includeByokInLimit: false`).
- Always use a non-resetting spending limit (`limitReset: null`).
- Track bulk create, edit, enable, disable, and delete operations in shared
  server memory so progress survives page reloads and is visible to all admins.
- Pause all key-editing actions while bulk work is running, and allow completed
  activity records to be cleared from the dashboard.
- Show the guardrail's available model count and allowed model details.

Bulk-operation records are retained for one hour, up to 100 records. They are
cleared whenever the server process restarts. Completed bulk-creation records
retain their plaintext keys for that window so they can be viewed after a page
reload.

> This dashboard intentionally has no authentication. Please be careful when deploying it to a public server. It is intended for local use only.

## Scripts

- `pnpm dev` starts the application in watch mode with tsx.
- `pnpm start` starts the application once with tsx.
- `pnpm test` runs the server-side test suite.
- `pnpm typecheck` type-checks the application.
- `pnpm build` compiles the application to `dist/`.
