#!/usr/bin/env bash
#
# deploy-locally.sh — create the vcoding environments as local Multipass VMs.
#
# This is the Azure-free counterpart to deploy.sh. It renders the same cloud-init
# bootstrap, persists separate local credentials, and safely reuses existing VMs.

set -euo pipefail

PREFIX="${PREFIX:-vcenv-local}"
COUNT="${COUNT:-2}"
IMAGE="${IMAGE:-24.04}"
CPUS="${CPUS:-2}"
MEMORY="${MEMORY:-4G}"
DISK="${DISK:-64G}"
ADMIN_USERNAME="student"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${LOCAL_STATE_DIR:-$SCRIPT_DIR/.state/local}"
CRED_FILE="$STATE_DIR/credentials.json"
LOGINS_TXT="$STATE_DIR/logins.txt"
LOGINS_CSV="$STATE_DIR/logins.csv"
BOOTSTRAP_TMPL="$SCRIPT_DIR/cloud-init/bootstrap.sh"

usage() {
  cat >&2 <<USAGE
Usage: ./deploy-locally.sh [--rotate-passwords] [--verify]

  --rotate-passwords  Generate new passwords for newly created VMs. Existing VMs
                      keep their current password because cloud-init runs once.
  --verify            Wait for provisioning and smoke-test every local VM.

Environment overrides:
  COUNT   Number of VMs (default: 2)
  PREFIX  Instance name prefix (default: vcenv-local)
  IMAGE   Multipass Ubuntu image (default: 24.04)
  CPUS    vCPUs per VM (default: 2)
  MEMORY  RAM per VM (default: 4G)
  DISK    Disk per VM (default: 64G)
USAGE
}

VERIFY=false
ROTATE_PW=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify) VERIFY=true; shift ;;
    --rotate-passwords|--new-passwords) ROTATE_PW=true; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) echo "ERROR: unknown option '$1'" >&2; usage; exit 1 ;;
    *) echo "ERROR: unexpected argument '$1'" >&2; usage; exit 1 ;;
  esac
done

for cmd in multipass jq envsubst base64 od fold awk; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "ERROR: required command '$cmd' not found" >&2
    exit 1
  }
done
[[ "$COUNT" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: COUNT must be a positive integer" >&2; exit 1; }

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
[[ -f "$CRED_FILE" ]] || printf '{}\n' > "$CRED_FILE"
chmod 600 "$CRED_FILE"

echo ">> Backend      : Multipass"
echo ">> Ubuntu image : $IMAGE"
echo ">> VM count     : $COUNT"
echo ">> Per VM       : $CPUS CPU, $MEMORY RAM, $DISK disk"

pick() {
  local chars="$1" number index
  number=$(od -An -N2 -tu2 /dev/urandom | tr -d ' ')
  index=$((number % ${#chars}))
  printf '%s' "${chars:index:1}"
}

gen_password() {
  local special='._-+=' pool='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' password="" i
  password+=$(pick 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  password+=$(pick 'abcdefghijklmnopqrstuvwxyz')
  password+=$(pick '0123456789')
  password+=$(pick "$special")
  for i in 1 2 3 4 5 6; do password+=$(pick "$pool"); done
  printf '%s' "$password" | fold -w1 | awk 'BEGIN{srand()}{print rand()"\t"$0}' | sort | cut -f2 | tr -d '\n'
}

write_cloud_config() {
  local bootstrap_b64="$1" destination="$2"
  cat > "$destination" <<EOF
#cloud-config
ssh_pwauth: true
users:
  - default
  - name: $ADMIN_USERNAME
    groups: [sudo]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
write_files:
  - path: /opt/vcenv/bootstrap.sh
    permissions: '0755'
    owner: root:root
    encoding: b64
    content: $bootstrap_b64
runcmd:
  - [ bash, /opt/vcenv/bootstrap.sh ]
EOF
  chmod 600 "$destination"
}

$ROTATE_PW && echo ">> Rotating stored passwords for newly created VMs."

for i in $(seq 1 "$COUNT"); do
  name="${PREFIX}-${i}"
  exists=false
  if multipass info "$name" >/dev/null 2>&1; then
    exists=true
  fi

  if $ROTATE_PW && ! $exists; then
    password=""
  else
    password=$(jq -r --arg name "$name" '.[$name].password // empty' "$CRED_FILE")
  fi
  if $exists && [[ -z "$password" ]]; then
    echo "ERROR: '$name' exists but its password is missing from $CRED_FILE" >&2
    echo "       Restore the state file or recreate that Multipass instance." >&2
    exit 1
  fi
  if [[ -z "$password" ]]; then
    password=$(gen_password)
    temp_credentials=$(mktemp)
    jq --arg name "$name" --arg user "$ADMIN_USERNAME" --arg password "$password" \
      '.[$name] = {user:$user, password:$password}' "$CRED_FILE" > "$temp_credentials"
    mv "$temp_credentials" "$CRED_FILE"
    chmod 600 "$CRED_FILE"
    echo ">> [$name] generated new credentials"
  else
    echo ">> [$name] reusing stored credentials"
  fi

  if $exists; then
    state=$(multipass info "$name" --format json | jq -r --arg name "$name" '.info[$name].state // empty')
    if [[ "${state,,}" == "running" ]]; then
      echo ">> [$name] already exists and is running"
    else
      echo ">> [$name] already exists; starting it"
      multipass start "$name"
    fi
    continue
  fi

  export VC_STUDENT_USER="$ADMIN_USERNAME" VC_STUDENT_PASSWORD="$password" VC_FQDN="__LOCAL__"
  rendered=$(envsubst '${VC_STUDENT_USER} ${VC_STUDENT_PASSWORD} ${VC_FQDN}' < "$BOOTSTRAP_TMPL")
  bootstrap_b64=$(printf '%s' "$rendered" | base64 | tr -d '\n')
  cloud_config="$STATE_DIR/cloud-init-${name}.yaml"
  write_cloud_config "$bootstrap_b64" "$cloud_config"

  echo ">> [$name] launching"
  multipass launch "$IMAGE" \
    --name "$name" \
    --cpus "$CPUS" \
    --memory "$MEMORY" \
    --disk "$DISK" \
    --cloud-init "$cloud_config"
done

printf 'environment,code_server_url,code_server_password,dev_url,vm_ip,shell_command\n' > "$LOGINS_CSV"
: > "$LOGINS_TXT"
{
  printf '================  LOCAL STUDENT LOGINS  ================\n'
  for i in $(seq 1 "$COUNT"); do
    name="${PREFIX}-${i}"
    password=$(jq -r --arg name "$name" '.[$name].password' "$CRED_FILE")
    ip=$(multipass info "$name" --format json | jq -r --arg name "$name" '.info[$name].ipv4[0] // empty')
    [[ -n "$ip" ]] || { echo "ERROR: could not determine IP address for '$name'" >&2; exit 1; }
    code_url="http://$ip/"
    dev_url="http://$ip:8080/"
    shell_command="multipass shell $name"
    printf '%s,%s,%s,%s,%s,%s\n' "$name" "$code_url" "$password" "$dev_url" "$ip" "$shell_command" >> "$LOGINS_CSV"
    printf '\nEnvironment %d  (%s)\n' "$i" "$name"
    printf '  Code Server (HTTP) : %s\n' "$code_url"
    printf '  Password           : %s\n' "$password"
    printf '  Dev server (HTTP)  : %s   (bind your app to 0.0.0.0:8080)\n' "$dev_url"
    printf '  VM shell           : %s\n' "$shell_command"
  done
  printf '\n========================================================\n'
} | tee "$LOGINS_TXT"
chmod 600 "$LOGINS_CSV" "$LOGINS_TXT"

echo ">> Local login details written to $STATE_DIR"
if ! $VERIFY; then
  echo ">> Provisioning may continue in the background. Re-run with --verify to wait and smoke-test."
fi

if $VERIFY; then
  for i in $(seq 1 "$COUNT"); do
    name="${PREFIX}-${i}"
    echo ">> [$name] waiting for cloud-init and verifying tools"
    multipass exec "$name" -- cloud-init status --wait
    multipass exec "$name" -- sudo -iu "$ADMIN_USERNAME" bash -lc \
      'code-server --version | head -1; node -v; dotnet --version; gh --version | head -1; pi --version'
    multipass exec "$name" -- systemctl is-active "code-server@$ADMIN_USERNAME" caddy
  done
fi
