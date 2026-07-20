# Hackathon Admin Tool

An unprotected TypeScript and Express dashboard with two internal tools:

- **OpenRouter AI API Key Manager** manages participant API keys in the
  Hackathon OpenRouter workspace. Every new key is assigned to the existing
  `hackathon member` guardrail.
- **Redeem Access Key Manager** manages the short codes and access information
  stored in the private Azure `AccessCodes` table.

## Run locally

```sh
pnpm install
cp .env.example .env
# Configure OpenRouter and Azure Table Storage in .env
pnpm dev
```

Open <http://localhost:3000>.

The Azure identity running the tool needs the `Storage Table Data Contributor`
role on the storage account and network access to its Table endpoint.

## OpenRouter manager capabilities

- List and search all active and disabled keys in the Hackathon workspace.
- Create one key or up to 100 keys at once, returning plaintext values once.
- Automatically assign every newly created key to a pre-defined guardrail.
- Edit limits and names, quickly disable, or delete individual keys.
- Bulk update, quickly disable, and bulk delete selected keys.
- Generate one redeem key per newly revealed API key, using the API key name as
  its label and the plaintext API key as its access information.
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

## Redeem access manager capabilities

- List and search access-key records, including their plaintext short codes.
- Generate a random 12-character code or accept an administrator-supplied code.
- Store the normalized plaintext code as the Azure Table `RowKey`, partitioned
  by its first two characters for efficient point lookups.
- Copy existing plaintext codes from the access-key list.
- Edit labels, access information, expiry, and enabled state.
- Select up to 100 records for bulk editing or enable/disable actions.
- Download selected plaintext codes as a `label,key` CSV file.
- Delete access-key records with optimistic concurrency protection.
- Show the configured Azure subscription, tenant, and resource group in the
  sidebar.

> This dashboard intentionally has no authentication. Keep it on a trusted
> workstation or private administrative network; never expose it publicly.

## Scripts

- `pnpm dev` starts the application in watch mode with tsx.
- `pnpm start` starts the application once with tsx.
- `pnpm test` runs the server-side test suite.
- `pnpm typecheck` type-checks the application.
- `pnpm build` compiles the application to `dist/`.
