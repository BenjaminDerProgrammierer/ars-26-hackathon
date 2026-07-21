# Ars Electronica Festival 2026 — AI Hackathon

Materials and services for the AI hackathon at
[Ars Electronica Festival 2026](https://ars.electronica.art/negotiatinghumanity/en/)
(*Future Begins / Negotiating Humanity*, September 2026, Linz). Participants
build applications that combine the festival program with open data from the
City of Linz.

## Repository overview

| Path | Purpose |
| --- | --- |
| [`web/`](web/) | Bilingual Astro website with participant guides and dataset pages. Dataset pages are generated directly from the reviewed Markdown in `opendata-linz/`. |
| [`admin-tool/`](admin-tool/) | Internal TypeScript/Express dashboard for OpenRouter participant keys and Azure Table Storage redeem codes. The dashboard is intentionally unauthenticated and must not be exposed publicly. |
| [`ai-proxy/`](ai-proxy/) | Prototype account portal and OpenAI-compatible Mistral proxy with per-contestant usage budgets. |
| [`dev-venv-generator/`](dev-venv-generator/) | Creates disposable, browser-based student development environments on Azure or locally with Docker. |
| [`infra/`](infra/) | Bicep infrastructure for the Azure `AccessCodes` table, container web app, managed identity, monitoring, and alerts. |
| [`ars-dataset/`](ars-dataset/) | Gitignored working snapshot of the Festival 2026 CMS export plus provider-feedback notes. |
| [`opendata-linz/`](opendata-linz/) | Reviewed City of Linz open-data catalog, per-dataset verdicts, source links, and research archive. |
| [`.agents/skills/`](.agents/skills/) | Repository-specific agent workflows for the festival dataset, UI design, and documentation lookup. |

## Quick start

The projects are independent; install and run only the component you need.

### Website

Requires Node.js 22.12 or newer.

```sh
cd web
npm install
npm run dev
```

The site runs at <http://localhost:4321>. Use `npm run check` for Astro,
TypeScript, and formatting checks, or `npm run build` to create the static site.
Pushes to `main` deploy the website through GitHub Actions.

### Admin tool

Requires Node.js 22 or newer and pnpm.

```sh
cd admin-tool
pnpm install
cp .env.example .env
# Configure OpenRouter and Azure Table Storage in .env.
pnpm dev
```

The dashboard runs at <http://localhost:3000>. See the
[admin-tool documentation](admin-tool/README.md) for required Azure permissions,
configuration, tests, and operational constraints.

### Student development environments

Use `dev-venv-generator/deploy.sh` for Azure VMs or
`dev-venv-generator/deploy-locally.sh` for Docker-based environments. Both
variants provision code-server and the workshop toolchain. See the
[deployment guide](dev-venv-generator/README.md) before creating environments.

## Data

The latest festival export is available from the
[official hackathon data endpoint](https://ars.electronica.art/negotiatinghumanity/hackathondata/).
Store a local working copy as `ars-dataset/notion_export.json`; the file is
gitignored and is therefore not present in a fresh clone.

The website's Linz dataset catalog is sourced from the authoritative reviews in
[`opendata-linz/`](opendata-linz/). Update those per-dataset README files rather
than maintaining a second copy under `web/`.

## Infrastructure conventions

Shared Azure resources for this repository belong in the
`ArsElectronicaHackathon` resource group and use the `austriaeast` region. Do
not commit credentials, generated access codes, API keys, or local environment
files.
