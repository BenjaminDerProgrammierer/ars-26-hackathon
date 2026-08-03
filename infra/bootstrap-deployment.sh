#!/usr/bin/env bash

set -euo pipefail

readonly RESOURCE_GROUP="ArsElectronicaHackathon"
readonly LOCATION="austriaeast"
readonly TEMPLATE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/main.bicep"
readonly GHCR_PACKAGE="ars-26-hackathon-web"

repository="${GITHUB_REPOSITORY:-}"
admin_principal_id="${AZURE_ADMIN_PRINCIPAL_ID:-}"
admin_principal_type="${AZURE_ADMIN_PRINCIPAL_TYPE:-}"
alert_email=""
skip_admin_roles=false
skip_github=false

usage() {
  cat <<'EOF'
Usage: infra/bootstrap-deployment.sh [options]

Deploy the shared Azure infrastructure and configure its one-time prerequisites.
The command is idempotent and can be rerun after the first container publish to
make the newly-created GHCR package public.

Options:
  --repository OWNER/REPO       GitHub repository (default: current gh repo)
  --alert-email EMAIL           Override the infrastructure alert recipient
  --admin-principal-id ID       Azure object ID used by the local admin tool
  --admin-principal-type TYPE   User, Group, or ServicePrincipal
  --skip-admin-roles            Do not grant roles to an admin-tool identity
  --skip-github                 Do not set repository variables or GHCR visibility
  -h, --help                    Show this help

Environment equivalents:
  GITHUB_REPOSITORY, AZURE_ADMIN_PRINCIPAL_ID, AZURE_ADMIN_PRINCIPAL_TYPE
EOF
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

while (($# > 0)); do
  case "$1" in
    --repository)
      (($# >= 2)) || fail "--repository requires OWNER/REPO"
      repository="$2"
      shift 2
      ;;
    --alert-email)
      (($# >= 2)) || fail "--alert-email requires an address"
      alert_email="$2"
      shift 2
      ;;
    --admin-principal-id)
      (($# >= 2)) || fail "--admin-principal-id requires an Azure object ID"
      admin_principal_id="$2"
      shift 2
      ;;
    --admin-principal-type)
      (($# >= 2)) || fail "--admin-principal-type requires User, Group, or ServicePrincipal"
      admin_principal_type="$2"
      shift 2
      ;;
    --skip-admin-roles)
      skip_admin_roles=true
      shift
      ;;
    --skip-github)
      skip_github=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
done

require_command az
if [[ "$skip_github" == false ]]; then
  require_command gh
fi

az account show --output none || fail "sign in with 'az login' before running the bootstrap"

if [[ "$skip_github" == false ]]; then
  gh auth status >/dev/null 2>&1 || fail "sign in with 'gh auth login' before running the bootstrap"
  if [[ -z "$repository" ]]; then
    repository="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
  fi
  [[ "$repository" =~ ^[^/]+/[^/]+$ ]] || fail "repository must use OWNER/REPO format"
  github_owner="${repository%%/*}"
  github_repository="${repository#*/}"
else
  # The Bicep defaults preserve the production federation when GitHub setup is skipped.
  github_owner="BenjaminDerProgrammierer"
  github_repository="ars-26-hackathon"
fi

subscription_id="$(az account show --query id --output tsv)"
tenant_id="$(az account show --query tenantId --output tsv)"

printf 'Ensuring resource group %s in %s...\n' "$RESOURCE_GROUP" "$LOCATION"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

deployment_arguments=(
  deployment group create
  --name deployment-bootstrap
  --resource-group "$RESOURCE_GROUP"
  --template-file "$TEMPLATE_FILE"
  --parameters
  "location=$LOCATION"
  "githubOrganization=$github_owner"
  "githubRepository=$github_repository"
  --only-show-errors
  --output none
)
if [[ -n "$alert_email" ]]; then
  deployment_arguments+=("alertEmailAddress=$alert_email")
fi

printf 'Deploying shared infrastructure and GitHub federated identity...\n'
az "${deployment_arguments[@]}"

deployment_output() {
  az deployment group show \
    --name deployment-bootstrap \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs.$1.value" \
    --output tsv
}

storage_account_id="$(deployment_output storageAccountResourceId)"
storage_account_name="$(deployment_output storageAccountName)"
subnet_id="$(deployment_output developmentEnvironmentSubnetResourceId)"
github_client_id="$(deployment_output githubDeploymentClientId)"

if [[ "$skip_admin_roles" == false ]]; then
  if [[ -z "$admin_principal_id" ]]; then
    account_type="$(az account show --query user.type --output tsv)"
    account_name="$(az account show --query user.name --output tsv)"
    case "${account_type,,}" in
      user)
        admin_principal_id="$(az ad signed-in-user show --query id --output tsv)"
        admin_principal_type="User"
        ;;
      serviceprincipal)
        admin_principal_id="$(az ad sp show --id "$account_name" --query id --output tsv)"
        admin_principal_type="ServicePrincipal"
        ;;
      *)
        fail "cannot resolve Azure principal type '$account_type'; pass --admin-principal-id and --admin-principal-type"
        ;;
    esac
  fi

  [[ -n "$admin_principal_type" ]] || fail "--admin-principal-type is required with --admin-principal-id"
  case "$admin_principal_type" in
    User | Group | ServicePrincipal) ;;
    *) fail "admin principal type must be User, Group, or ServicePrincipal" ;;
  esac

  resource_group_id="/subscriptions/$subscription_id/resourceGroups/$RESOURCE_GROUP"

  ensure_role_assignment() {
    local role_id="$1"
    local role_name="$2"
    local scope="$3"
    local assignment_count
    assignment_count="$(az role assignment list \
      --assignee-object-id "$admin_principal_id" \
      --role "$role_id" \
      --scope "$scope" \
      --query 'length(@)' \
      --output tsv)"
    if [[ "$assignment_count" == "0" ]]; then
      printf 'Granting %s on %s...\n' "$role_name" "$scope"
      az role assignment create \
        --assignee-object-id "$admin_principal_id" \
        --assignee-principal-type "$admin_principal_type" \
        --role "$role_id" \
        --scope "$scope" \
        --output none
    else
      printf '%s is already granted on %s.\n' "$role_name" "$scope"
    fi
  }

  # Virtual Machine Contributor manages VMs/disks/extensions; Network Contributor
  # covers the public IPs, NICs, and shared-subnet joins created by the admin tool.
  ensure_role_assignment \
    "9980e02c-c2be-4d73-94e8-173b1dc7cf3c" \
    "Virtual Machine Contributor" \
    "$resource_group_id"
  ensure_role_assignment \
    "4d97b98b-1d4f-4787-a291-c67834d212e7" \
    "Network Contributor" \
    "$resource_group_id"
  ensure_role_assignment \
    "0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3" \
    "Storage Table Data Contributor" \
    "$storage_account_id"
  ensure_role_assignment \
    "ba92f5b4-2d11-453d-a403-e96b0029c9fe" \
    "Storage Blob Data Contributor" \
    "$storage_account_id"
fi

network_access="$(az storage account show \
  --ids "$storage_account_id" \
  --query '[publicNetworkAccess,networkRuleSet.defaultAction]' \
  --output tsv)"
[[ "$network_access" == $'Enabled\tAllow' ]] || fail \
  "storage network access is not enabled with default Allow (found: $network_access)"
az network vnet subnet show --ids "$subnet_id" --output none
printf 'Verified storage network access and shared development subnet %s.\n' "$subnet_id"

if [[ "$skip_github" == false ]]; then
  printf 'Configuring Azure OIDC repository variables on %s...\n' "$repository"
  gh variable set AZURE_CLIENT_ID --repo "$repository" --body "$github_client_id"
  gh variable set AZURE_TENANT_ID --repo "$repository" --body "$tenant_id"
  gh variable set AZURE_SUBSCRIPTION_ID --repo "$repository" --body "$subscription_id"

  owner_type="$(gh api "/users/$github_owner" --jq .type)"
  if [[ "$owner_type" == "Organization" ]]; then
    package_endpoint="/orgs/$github_owner/packages/container/$GHCR_PACKAGE"
  else
    authenticated_login="$(gh api /user --jq .login)"
    [[ "${authenticated_login,,}" == "${github_owner,,}" ]] || fail \
      "GHCR package is owned by $github_owner; authenticate gh as that user to change its visibility"
    package_endpoint="/user/packages/container/$GHCR_PACKAGE"
  fi

  package_error_file="$(mktemp)"
  trap 'rm -f "$package_error_file"' EXIT
  if gh api --method PATCH "$package_endpoint" --field visibility=public \
    >/dev/null 2>"$package_error_file"; then
    printf 'GHCR package %s is public.\n' "$GHCR_PACKAGE"
  elif grep -q 'HTTP 404' "$package_error_file"; then
    printf '%s\n' \
      "GHCR package $GHCR_PACKAGE does not exist yet." \
      "Run the Publish web container workflow once, then rerun this bootstrap command."
  else
    cat "$package_error_file" >&2
    fail "could not make the GHCR package public; the gh token may need 'write:packages' (run 'gh auth refresh -s write:packages')"
  fi
  rm -f "$package_error_file"
  trap - EXIT
fi

printf '\nDeployment bootstrap complete.\n'
printf 'Admin-tool Azure settings:\n'
printf '  AZURE_SUBSCRIPTION_ID=%s\n' "$subscription_id"
printf '  AZURE_TENANT_ID=%s\n' "$tenant_id"
printf '  AZURE_RESOURCE_GROUP=%s\n' "$RESOURCE_GROUP"
printf '  AZURE_STORAGE_ACCOUNT_NAME=%s\n' "$storage_account_name"
