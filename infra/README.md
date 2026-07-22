# Infrastructure

Store infrastructure-as-code definitions and deployment support files for this
repository in this directory.

Azure deployments must use:

- Resource group: `ArsElectronicaHackathon`
- Region: `austriaeast`

Do not commit credentials, secrets, or environment-specific access tokens.

## Deploy

The `Publish web container` GitHub Actions workflow builds `web/Dockerfile` and
publishes `ghcr.io/benjaminderprogrammierer/ars-26-hackathon-web:latest`. After
the first workflow run, set that GHCR package's visibility to **Public** so App
Service can pull it anonymously.

Deploy the resource group:

```sh
az deployment group create \
  --resource-group ArsElectronicaHackathon \
  --template-file infra/main.bicep \
  --parameters alertEmailAddress=you@example.com
```

Override `webAppContainerImage` to deploy a different public image tag or digest.

The template creates a single-worker Linux App Service plan, a container web app
listening on port 80, a Log Analytics workspace, retained diagnostics, an HTTP
5xx alert, a user-assigned managed identity, and the shared VNet, subnet, and NSG
used by the admin tool's development-environment VMs. The NSG permits inbound
TCP traffic on ports 22, 80, 443, and 8080. The identity is attached to the web
app and receives `Storage Table Data Reader` on the `AccessCodes` table only.
The shared network uses Azure Verified Modules for its VNet and NSG. The admin
tool deploys each development-environment VM, NIC, public IP, and OS disk from
`modules/development-environment.bicep`, which uses the AVM virtual-machine
module.
Set `alertEmailAddress` to route the alert to an operator; leaving it empty keeps
the Azure Monitor alert active without email delivery.
The image must be publicly pullable unless registry authentication is configured
separately. Each workflow run also publishes a commit-addressed `sha-<commit>`
tag; use the registry-provided digest when an immutable image reference is
required.
