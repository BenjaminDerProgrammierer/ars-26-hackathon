#!/usr/bin/env bash
# Create or reuse local Docker containers for the student coding environments.

set -euo pipefail

PREFIX="${PREFIX:-vcenv-local}"
COUNT="${COUNT:-2}"
CPUS="${CPUS:-2}"
MEMORY="${MEMORY:-4g}"
CODE_PORT_BASE="${CODE_PORT_BASE:-9001}"
DEV_PORT_BASE="${DEV_PORT_BASE:-8081}"
IMAGE="${IMAGE:-vcenv-local:latest}"
ADMIN_USERNAME=student

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${LOCAL_STATE_DIR:-$SCRIPT_DIR/.state/local}"
CRED_FILE="$STATE_DIR/credentials.json"
LOGINS_TXT="$STATE_DIR/logins.txt"
LOGINS_CSV="$STATE_DIR/logins.csv"

usage() {
  cat >&2 <<USAGE
Usage: ./deploy-locally.sh [--rotate-passwords] [--verify]

  --rotate-passwords  Generate fresh passwords for newly created containers.
                      Existing containers keep their current credentials.
  --verify            Wait for every container to become healthy and test tools.

Environment overrides:
  COUNT           Number of containers (default: 2)
  PREFIX          Container name prefix (default: vcenv-local)
  CPUS            CPU limit per container (default: 2)
  MEMORY          Memory limit per container (default: 4g)
  CODE_PORT_BASE  First host port for code-server (default: 9001)
  DEV_PORT_BASE   First host port for student dev servers (default: 8081)
  IMAGE           Built image tag (default: vcenv-local:latest)
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

for cmd in docker jq od fold awk; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: required command '$cmd' not found" >&2; exit 1; }
done
[[ "$COUNT" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: COUNT must be a positive integer" >&2; exit 1; }
[[ "$CODE_PORT_BASE" =~ ^[0-9]+$ && "$DEV_PORT_BASE" =~ ^[0-9]+$ ]] || {
  echo "ERROR: CODE_PORT_BASE and DEV_PORT_BASE must be integers" >&2
  exit 1
}
last_code_port=$((CODE_PORT_BASE + COUNT - 1))
last_dev_port=$((DEV_PORT_BASE + COUNT - 1))
if (( CODE_PORT_BASE < 1 || DEV_PORT_BASE < 1 || last_code_port > 65535 || last_dev_port > 65535 )); then
  echo "ERROR: requested host port range falls outside 1-65535" >&2
  exit 1
fi
docker info >/dev/null

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
[[ -f "$CRED_FILE" ]] || printf '{}\n' > "$CRED_FILE"
chmod 600 "$CRED_FILE"

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

echo ">> Building shared image: $IMAGE"
docker build --tag "$IMAGE" --file "$SCRIPT_DIR/container/Dockerfile" "$SCRIPT_DIR"

$ROTATE_PW && echo ">> Rotating stored passwords for newly created containers."

for i in $(seq 1 "$COUNT"); do
  name="${PREFIX}-${i}"
  code_port=$((CODE_PORT_BASE + i - 1))
  dev_port=$((DEV_PORT_BASE + i - 1))
  exists=false
  if docker container inspect "$name" >/dev/null 2>&1; then exists=true; fi

  password=$(jq -r --arg name "$name" '.[$name].password // empty' "$CRED_FILE")
  if $exists; then
    container_json=$(docker container inspect "$name")
    owner=$(jq -r '.[0].Config.Labels["vcenv.local"] // empty' <<< "$container_json")
    [[ "$owner" == "true" ]] || { echo "ERROR: container '$name' exists but is not managed by this script" >&2; exit 1; }
    [[ -n "$password" ]] || { echo "ERROR: credentials for existing container '$name' are missing" >&2; exit 1; }
    container_password=$(jq -r '.[0].Config.Env[] | select(startswith("VC_PASSWORD=")) | sub("^VC_PASSWORD="; "")' <<< "$container_json")
    [[ "$container_password" == "$password" ]] || {
      echo "ERROR: stored credentials do not match existing container '$name'" >&2
      exit 1
    }
    actual_code_port=$(jq -r '.[0].HostConfig.PortBindings["9000/tcp"][0].HostPort // empty' <<< "$container_json")
    actual_dev_port=$(jq -r '.[0].HostConfig.PortBindings["8080/tcp"][0].HostPort // empty' <<< "$container_json")
    if [[ "$actual_code_port" != "$code_port" || "$actual_dev_port" != "$dev_port" ]]; then
      echo "ERROR: '$name' uses host ports $actual_code_port/$actual_dev_port, expected $code_port/$dev_port" >&2
      echo "       Re-run with the original port bases or recreate the container." >&2
      exit 1
    fi
    running=$(jq -r '.[0].State.Running' <<< "$container_json")
    if [[ "$running" == "true" ]]; then
      echo ">> [$name] already exists and is running"
    else
      echo ">> [$name] already exists; starting it"
      docker container start "$name" >/dev/null
    fi
    continue
  fi

  if $ROTATE_PW || [[ -z "$password" ]]; then
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

  echo ">> [$name] creating on code port $code_port and dev port $dev_port"
  docker container run --detach \
    --name "$name" \
    --label vcenv.local=true \
    --restart unless-stopped \
    --cpus "$CPUS" \
    --memory "$MEMORY" \
    --publish "127.0.0.1:${code_port}:9000" \
    --publish "127.0.0.1:${dev_port}:8080" \
    --volume "${name}-home:/home/$ADMIN_USERNAME" \
    --env "VC_PASSWORD=$password" \
    --env "VC_PUBLIC_HOST=localhost" \
    --env "VC_DEV_URL=http://localhost:${dev_port}/" \
    "$IMAGE" >/dev/null
done

printf 'environment,code_server_url,code_server_password,dev_url,container_name,shell_command\n' > "$LOGINS_CSV"
: > "$LOGINS_TXT"
{
  printf '===============  LOCAL CONTAINER LOGINS  ===============\n'
  for i in $(seq 1 "$COUNT"); do
    name="${PREFIX}-${i}"
    password=$(jq -r --arg name "$name" '.[$name].password' "$CRED_FILE")
    code_port=$((CODE_PORT_BASE + i - 1))
    dev_port=$((DEV_PORT_BASE + i - 1))
    code_url="http://localhost:$code_port/"
    dev_url="http://localhost:$dev_port/"
    shell_command="docker exec -it --user $ADMIN_USERNAME $name bash -l"
    printf '%s,%s,%s,%s,%s,%s\n' "$name" "$code_url" "$password" "$dev_url" "$name" "$shell_command" >> "$LOGINS_CSV"
    printf '\nEnvironment %d  (%s)\n' "$i" "$name"
    printf '  Code Server (HTTP) : %s\n' "$code_url"
    printf '  Password           : %s\n' "$password"
    printf '  Dev server (HTTP)  : %s\n' "$dev_url"
    printf '  Container shell    : %s\n' "$shell_command"
  done
  printf '\n========================================================\n'
} | tee "$LOGINS_TXT"
chmod 600 "$LOGINS_CSV" "$LOGINS_TXT"
echo ">> Local login details written to $STATE_DIR"

if $VERIFY; then
  verify_timeout="${VERIFY_TIMEOUT:-180}"
  for i in $(seq 1 "$COUNT"); do
    name="${PREFIX}-${i}"
    echo ">> [$name] waiting up to ${verify_timeout}s for code-server"
    deadline=$((SECONDS + verify_timeout))
    while [[ "$(docker container inspect --format '{{.State.Health.Status}}' "$name")" != "healthy" ]]; do
      if (( SECONDS >= deadline )); then
        docker container logs --tail 50 "$name" >&2
        echo "ERROR: '$name' did not become healthy" >&2
        exit 1
      fi
      sleep 2
    done
    docker container exec --user "$ADMIN_USERNAME" "$name" bash -lc \
      'code-server --version | head -1; node -v; dotnet --version; gh --version | head -1; pi --version'
  done
fi
