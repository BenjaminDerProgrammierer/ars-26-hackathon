# Hackathon Admin Tool

An unprotected TypeScript and Express dashboard with three internal tools:

- **OpenRouter AI API Key Manager** manages participant API keys in the
  Hackathon OpenRouter workspace. Every new key uses OpenRouter's default
  guardrail.
- **Redeem Access Key Manager** manages the short codes and access information
  stored in the private Azure `AccessCodes` table.
- **Development Environment Manager** creates Ubuntu 24.04 LTS virtual machines
  through the Azure JavaScript SDK, initializes them with cloud-init, and stores
  their student logins in Azure Table Storage.

## Run locally

```sh
pnpm install
cp .env.example .env
# Configure OpenRouter and Azure Table Storage in .env
pnpm dev
```

Open <http://localhost:3000>.

Set `OPENROUTER_ACCOUNT_NAME` to show the account or organization display name
in the API-key manager sidebar.

The Azure identity running the tool needs the `Storage Table Data Contributor`
and `Storage Blob Data Contributor` roles on the storage account, plus network
access to its Table and Blob endpoints. The tool creates the configured
`AdminOperations` table and `admin-operation-leases` blob container on demand.
It also needs permission to create and manage virtual machines, disks, network
interfaces, and public IP addresses in the `ArsElectronicaHackathon` resource
group. The shared `vcenv-vnet`, `vcenv-subnet`, and `vcenv-nsg` must already be
deployed from `infra/main.bicep` before an environment is created.
The Azure CLI and its Bicep support must be installed and authenticated for the
same subscription; the Express application deploys each VM through
`infra/modules/development-environment.bicep`.
Subscription and resource-group metadata is discovered through Azure
Resource Manager when permitted. If discovery is unavailable, the sidebar uses
the optional `AZURE_SUBSCRIPTION_*`, `AZURE_TENANT_ID`, and
`AZURE_RESOURCE_GROUP` values without blocking table access.

## OpenRouter manager capabilities

- List and search all active and disabled keys in the Hackathon workspace.
- Create one key or up to 100 keys by count, assigning each an automatically
  generated eight-character name and returning plaintext values once.
- Rely on OpenRouter's default guardrail for every newly created key.
- Edit limits and names, quickly disable, or delete individual keys.
- Bulk update, quickly disable, and bulk delete selected keys.
- Generate one redeem key per newly revealed API key, using the API key name as
  its label and the plaintext API key as its access information.
- Keep linked redeem keys synchronized when API keys are renamed, enabled,
  disabled, or deleted.
- Always exclude BYOK usage from key limits (`includeByokInLimit: false`).
- Always use a non-resetting spending limit (`limitReset: null`).
- Track every create, edit, enable, disable, and delete operation in Azure Table
  Storage so progress survives server restarts and is visible to every replica.
- Pause all key-editing actions while bulk work is running, and allow completed
  activity records to be cleared from the dashboard.
- Show the guardrail's available model count and allowed model details.

Bulk-operation records are retained for one hour, up to 100 records. Completed
bulk-creation records retain their plaintext keys for that window so they can be
viewed after a page or server reload. A renewable 60-second blob lease prevents
concurrent API-key operations across server replicas. If a server stops during
an operation, its lease expires and the abandoned record is marked failed when
the dashboard next reads it.

## Redeem access manager capabilities

- List and search access-key records, including their plaintext short codes.
- Generate a random 12-character code or accept an administrator-supplied code.
- Store the normalized plaintext code as the Azure Table `RowKey`, partitioned
  by its first two characters for efficient point lookups.
- Copy existing plaintext codes from the access-key list.
- Edit labels, access information, expiry, and enabled state.
- Select up to 100 records to bulk-edit expiration, enable/disable, or delete.
- Download selected plaintext codes as a `label,key` CSV file.
- Delete access-key records with optimistic concurrency protection.
- Show the configured Azure subscription, resource group, and region in the
  sidebar.

## Development environment manager capabilities

- Create up to 45 Ubuntu 24.04 LTS virtual machines in
  `ArsElectronicaHackathon` and `austriaeast` through a Bicep deployment backed
  by the Azure Verified Module for virtual machines.
- Pass a rendered copy of `cloud-init/bootstrap.sh` to the VM through protected
  Custom Script extension settings; the dashboard never executes that script
  locally, and its embedded credentials stay out of deployment history.
- Create a separate OpenRouter API key for every VM, use the default guardrail,
  and configure its spending limit and expiration from the creation
  dialog.
- Configure pi with its built-in OpenRouter provider and the guardrail's sole
  available model. The model and fixed OpenRouter endpoint are not editable in
  the creation dialog.
- List and search environments, with bulk start, stop, delete, and redeem-key
  actions.
- Use a renewable blob lease to allow only one environment deployment or bulk
  lifecycle operation across all server replicas at a time.
- Store generated URLs, passwords, status, image metadata, and formatted login
  hand-outs in the `DevelopmentEnvironmentLogins` Azure table.
- Create one redeem key per environment using access text headed by
  `STUDENT LOGINS`, including immediately after a creation operation finishes.

Each VM uses `Standard_B2als_v2`, a 64 GB Standard SSD, a static public IP, and
the Canonical Ubuntu 24.04 LTS image. The infrastructure-managed shared network
security group exposes SSH, HTTP, HTTPS, and port 8080 as required by the
unmodified upstream bootstrap. Generated student credentials are stored in the
configured `DevelopmentEnvironmentLogins` table. OpenRouter key hashes are
retained with the environment record so deleting an environment also deletes
its API key; plaintext OpenRouter keys are only delivered to their corresponding
VM.

The bootstrap template is copied unchanged from
[`Teaching-HTL-Leonding/novedu-dev-venv-generator`](https://github.com/Teaching-HTL-Leonding/novedu-dev-venv-generator/tree/main/cloud-init).

> This dashboard intentionally has no authentication. Keep it on a trusted
> workstation or private administrative network; never expose it publicly.

## Scripts

- `pnpm dev` starts the application in watch mode with tsx.
- `pnpm start` starts the application once with tsx.
- `pnpm test` runs the server-side test suite.
- `pnpm typecheck` type-checks the application.
- `pnpm build` compiles the application to `dist/`.
