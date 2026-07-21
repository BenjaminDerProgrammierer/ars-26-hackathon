# Ars Electronica Festival 2026 AI Hackathon website

The bilingual public website for the hackathon, built with Astro.

## Development

Requires Node.js and npm to be installed.

```sh
npm install
npm run dev
```

The local site runs at <http://localhost:4321>.

Redeem-code lookups use your local Azure CLI credential. Configure `web/.env`
(it is ignored by Git):

```sh
cp web/.env.example web/.env
```

## Docker

Build the production image from the repository root:

```sh
docker build -f web/Dockerfile -t ars-hackathon-web .
```

The container listens on port 80. Pass storage configuration at runtime; Azure
App Service supplies the managed-identity endpoint automatically:

```sh
docker run --rm -p 8080:80 \
  -e AZURE_STORAGE_ACCOUNT_NAME=arselectronicahackathon \
  -e AZURE_STORAGE_TABLE_NAME=AccessCodes \
  ars-hackathon-web
```

`AZURE_STORAGE_TABLE_NAME` and `AZURE_STORAGE_TABLE_ENDPOINT` are optional. The
image defaults to the `AccessCodes` table and the standard storage endpoint.
Local development outside Docker continues to use `npm run dev` and `web/.env`.

## Deployment

Pushes to `main` that change the website build the static site and deploy it to
<https://benjaminderprogrammierer.github.io/ars-26-hackathon/>. The repository's
Pages source is configured as **GitHub Actions**.
The redeem route is server-rendered and is therefore only available in the App
Service deployment, not in the static Pages preview.

The production build runs as a standalone Node.js app on Azure App Service. Set
the startup command to `npm start`, configure `AZURE_STORAGE_ACCOUNT_NAME` (and
optionally `AZURE_STORAGE_TABLE_NAME` or `AZURE_STORAGE_TABLE_ENDPOINT`), enable
a managed identity, and pass its principal ID to the infrastructure deployment's
`webAppPrincipalId` parameter. This grants the identity read-only table access.
