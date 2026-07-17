# vcoding-env: temporary student coding environments on Azure

This project generates disposable, browser-based coding environments for students
on Azure. One command spins up *N* identical Linux VMs, each running
[code-server](https://github.com/coder/code-server) (VS Code in the browser) over
HTTPS, pre-loaded with a full toolchain and the [pi.dev](https://pi.dev) coding
agent, ready for students to configure with their own models and providers.

Everything is driven by a single idempotent `deploy.sh` that renders per-VM
cloud-init and deploys Bicep. Re-running it is safe: credentials are persisted
locally and reused, so VMs are not churned.

---

## What gets deployed

For each of `COUNT` environments (default 2), in resource group `vcoding-env`:

| Resource | Detail |
|---|---|
| Linux VM | `Standard_B2als_v2` (2 vCPU / 4 GB), Ubuntu 24.04 LTS |
| OS disk | 64 GB **Standard SSD**, used for all data |
| Public IP | with a clean DNS label → `vcenv-vm-N.<region>.cloudapp.azure.com` |
| Auth | SSH user **`student`** + a generated 10-char password (same password logs into code-server) |
| Tag | every per-VM resource tagged `environment=vcenv-0N` so a whole environment can be filtered at once |

Shared once per deployment: a VNet + subnet and a Network Security Group.

### Ports (NSG)

| Port | Purpose |
|---|---|
| 22 | SSH (user + password) |
| 443 | **code-server over HTTPS** (Caddy, auto Let's Encrypt cert) |
| 80 | Let's Encrypt HTTP-01 challenge + redirect to HTTPS |
| 8080 | **students' own dev servers** (plain HTTP; bind your app to `0.0.0.0:8080`) |

### What's installed on every VM

- **code-server** on `127.0.0.1:9000`, fronted by **Caddy** which terminates TLS
  on `:443` with an automatically issued & renewed Let's Encrypt certificate.
- **Node.js LTS** via **nvm**, plus **TypeScript** and **Vite**.
- **[pi.dev](https://pi.dev) coding agent**, with an empty provider/model configuration
  in `~/.pi/agent/models.json`. [`pi-web-access`](https://pi.dev/packages/pi-web-access) and
  [`@hypabolic/pi-hypa`](https://pi.dev/packages/@hypabolic/pi-hypa) are installed.
- **.NET 10 SDK**, **Python 3** (`python`/`pip`/`venv`), **ImageMagick**,
  **git**, **GitHub CLI (`gh`)**, build-essential.
- A ready-to-hack **`~/website`** workshop project: a minimal Vite + TypeScript
  static site (`index.html` / `index.ts` / `style.css`) whose `npm run dev`
  serves on `0.0.0.0:8080`. It ships an `AGENTS.md` and two Pi skills
  (`find-docs`, `frontend-design`) so students can drive it with pi immediately.

---

## Prerequisites

- **Azure CLI** logged in to the target subscription (`az login`).
- Local tools used by `deploy.sh`: `jq`, `envsubst` (gettext), and `base64`.
  (`bicep` is fetched by the Azure CLI automatically.)
- Sufficient regional **vCPU quota** for the `Standard Basv2` family
  (`deploy.sh` checks this before deploying and aborts with guidance if short).

---

## Usage

```bash
./deploy.sh                    # create/update the default 2 environments
COUNT=10 ./deploy.sh           # scale to 10 environments (designed up to ~45)
./deploy.sh --verify           # deploy, then smoke-test vcenv-vm-1 via run-command
./deploy.sh --rotate-passwords # new cohort: fresh passwords for all VMs
```

### Deploy locally (without Azure)

[Docker](https://docs.docker.com/engine/) can run the same toolchain in isolated
Ubuntu 24.04 containers on the local machine:

```bash
./deploy-locally.sh                    # build and create/reuse 2 containers
COUNT=4 ./deploy-locally.sh            # build and create/reuse 4 containers
./deploy-locally.sh --verify           # wait for health checks and smoke-test
```

Install Docker Engine and `jq` first. Each container defaults to a 2-CPU and 4 GB
limit; override these with `CPUS` and `MEMORY`. code-server and student dev
servers are published on loopback-only host ports, starting at 9001 and 8081;
override the ranges with `CODE_PORT_BASE` and `DEV_PORT_BASE`. Student home
directories live in named Docker volumes, while credentials and login lists are
kept under `.state/local/`. Existing named containers are started and reused.

The local image is built from `container/Dockerfile`. It reuses the shared
bootstrap to install the toolchain but skips VM-only services such as systemd,
SSH, and Caddy. To open a shell, use the exact `docker exec` command printed in
the login output. To remove an environment, remove both its container and its
`<container-name>-home` volume; removing the volume permanently deletes that
student's work.

Configuration lives at the top of `deploy.sh` (all overridable via environment):

| Variable | Default | Meaning |
|---|---|---|
| `RG` | `vcoding-env` | resource group |
| `PREFIX` | `vcenv` | name prefix for all resources |
| `COUNT` | `2` | number of environments |
| `LOCATION` | `austriaeast` | Azure region |
| `BATCH_SIZE` | `10` | max VMs per ARM deployment call; deploys are split into batches to stay under ARM's deployment-size limit |

### Output: the student logins

After a successful deploy, `deploy.sh` prints and writes (into the gitignored
`.state/` directory):

- **`.state/logins.txt`**, a hand-out list: per environment its code-server
  **HTTPS URL**, password, dev URL, and SSH command.
- **`.state/logins.csv`**: the same, spreadsheet-friendly.

The same generated password is used for both code-server (browser) and SSH.

## How it works

```
deploy.sh                     Orchestrator: config, quota preflight, credentials,
                              renders cloud-init, runs the Bicep deployment(s), in batches
                              of up to BATCH_SIZE (10) VMs, then prints logins.
bicep/
  main.bicep                  RG-scope: builds the network once, then loops one VM per
                              environment. Per-VM config (incl. passwords) is passed as a
                              single @secure() object so secrets stay out of deployment logs.
  network.bicep               VNet + subnet + NSG (22, 80, 443, 8080).
  vm.bicep                    One VM via the Azure Verified Module
                              (avm/res/compute/virtual-machine); sets size, 64 GB Standard
                              SSD, Ubuntu 24.04, public IP + DNS label, per-env tags,
                              and passes the cloud-init customData.
cloud-init/
  bootstrap.sh                Per-VM provisioning TEMPLATE. deploy.sh substitutes the
                              ${VC_*} placeholders (password and FQDN),
                              base64-encodes it, and delivers it as cloud-init customData.
container/
  Dockerfile                 Local container image using the shared bootstrap.
  entrypoint.sh              Seeds the persistent student home, applies runtime
                              credentials, and starts code-server as `student`.
.state/                       (gitignored) persisted credentials + generated params + logins.
```

### Idempotency & credentials

Generated per-VM usernames/passwords are stored in `.state/credentials.json` and
**reused** on every subsequent run (keyed by VM name). Passwords are random
(`/dev/urandom`), **not** derived from the VM name or FQDN. Because Bicep receives
the same `adminPassword`, re-running `deploy.sh` does not recreate the VMs.
(cloud-init provisioning runs once, at first boot; changing `bootstrap.sh`
therefore only affects *newly created* VMs.)

**Starting a new cohort on reused VM names:** since passwords are reused per VM
name, if you tear down the environments and redeploy the same names, the *new*
students would get the *same* passwords the previous cohort saw. To avoid that,
redeploy with `--rotate-passwords`, which generates fresh passwords for every VM
and overwrites `.state/credentials.json`. (It only takes effect on freshly created
VMs; Azure does not change the admin password of an already-existing VM, so rotate
*after* deleting the resource group.)

### Scaling to many environments

`COUNT` is designed to scale to ~45. The `/24` subnet holds them comfortably, and
`deploy.sh` performs a vCPU-quota preflight (45 environments = 90 vCPUs of the
`Standard Basv2` family); if the regional quota is too low it stops early and
tells you to request an increase. To stay under ARM's per-deployment size limit at
scale, the VMs are deployed in **batches of up to `BATCH_SIZE` (default 10)**: each
batch is a separate `vcenv-batch-N` deployment, and the shared network module is
idempotently re-applied in every batch.

---

## Security notes

- code-server is served over **HTTPS** with a trusted Let's Encrypt certificate;
  authentication is a per-VM password. Students' own dev servers on **8080 are
  plain HTTP** by design (scratch/demo traffic).
- These are **disposable** environments. Generated passwords are stored locally
  under `.state/`, acceptable for throwaway
  student boxes and not committed to git (`.gitignore` excludes `.state/`).
- To tear everything down: `az group delete -n vcoding-env --yes`.
