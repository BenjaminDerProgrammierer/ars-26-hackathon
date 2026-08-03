# Infrastructure

Store infrastructure-as-code definitions and deployment support files for this
repository in this directory.

Azure deployments must use:

- Resource group: `ArsElectronicaHackathon`
- Region: `austriaeast`

Do not commit credentials, secrets, or environment-specific access tokens.

## Bootstrap deployment

Run the idempotent bootstrap from the repository root while authenticated with
both the Azure CLI and GitHub CLI:

```sh
./infra/bootstrap-deployment.sh
```

The Azure identity must be able to deploy the resource-group template and
create role assignments (for example, an Owner at resource-group scope). The
GitHub identity must be a repository administrator and the package owner or an
organization member allowed to manage the package.

The command creates or updates the `ArsElectronicaHackathon` resource group and
all resources in `main.bicep`, including the GitHub deployment identity, its
`main`-branch federated credential, and the shared development-environment VNet.
It then:

- writes `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` as
  GitHub Actions repository variables;
- grants the signed-in Azure identity the scoped Virtual Machine Contributor,
  Network Contributor, Storage Table Data Contributor, and Storage Blob Data
  Contributor roles needed to run the local admin tool;
- verifies that the storage data endpoints are reachable over the public
  network and that the shared VM subnet exists; and
- makes the GHCR web package public when it exists.

The package is only created by the first successful `Publish web container`
workflow run. If the bootstrap reports that it does not exist, run that workflow
once and rerun the same bootstrap command. Changing package visibility requires
a GitHub CLI token with `write:packages`; add it with
`gh auth refresh -s write:packages` if GitHub returns HTTP 403.

Use `--admin-principal-id` together with `--admin-principal-type` to grant the
admin-tool roles to a different Azure identity, or use `--skip-admin-roles` and
`--skip-github` for a partial bootstrap. Run the command with `--help` for all
options. It prints the non-secret Azure settings required by
`admin-tool/.env` when it completes.

## Manual deployment

The `Publish web container` GitHub Actions workflow builds `web/Dockerfile` and
publishes `ghcr.io/benjaminderprogrammierer/ars-26-hackathon-web:latest`.

Deploy the resource group:

```sh
az deployment group create \
  --resource-group ArsElectronicaHackathon \
  --template-file infra/main.bicep \
  --parameters alertEmailAddress=benjamin.p.hartmann@gmail.com
```

Manual deployments do not configure the GitHub repository or admin-tool RBAC;
use the bootstrap command for those prerequisites.

Override `webAppContainerImage` to deploy a different public image tag or digest.

The template creates a single-worker Linux App Service plan, a container web app
listening on port 80 with `hackathon.ars.electronica.art` bound as its custom
hostname, a Log Analytics workspace, retained diagnostics, an HTTP 5xx alert, a
user-assigned managed identity, and the shared VNet, subnet, and NSG used by the
admin tool's development-environment VMs. The NSG permits inbound TCP traffic on
ports 22, 80, 443, and 8080. The identity is attached to the web app and receives
`Storage Table Data Reader` on the `AccessCodes` table only. The shared network
uses Azure Verified Modules for its VNet and NSG. The admin tool deploys each
development-environment VM, NIC, public IP, and OS disk from
`modules/development-environment.bicep`, which uses the AVM virtual-machine
module.
The HTTP 5xx alert routes to `benjamin.p.hartmann@gmail.com` by default. Override
`alertEmailAddress` to route production alerts to another operator.
The image must be publicly pullable unless registry authentication is configured
separately. Each workflow run also publishes a commit-addressed `sha-<commit>`
tag; use the registry-provided digest when an immutable image reference is
required.
