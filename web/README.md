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
cp .env.example .env
```

## Docker

Build the production image from the repository root:

```sh
docker build -f web/Dockerfile -t ars-hackathon-web .
```

The container listens on port 80. For a local redeem test, create an ignored
`web/.env.docker` file containing a Microsoft Entra service principal with
`Storage Table Data Reader` on the table:

```dotenv
AZURE_STORAGE_ACCOUNT_NAME=arselectronicahackathon
AZURE_STORAGE_TABLE_NAME=AccessCodes
AZURE_TOKEN_CREDENTIALS=EnvironmentCredential
AZURE_TENANT_ID=replace-me
AZURE_CLIENT_ID=replace-me
AZURE_CLIENT_SECRET=replace-me
```

Then pass that file at runtime:

```sh
docker run --rm -p 8080:80 \
  --env-file web/.env.docker \
  ars-hackathon-web
```

Do not commit `.env.docker`. Azure App Service supplies the managed-identity
endpoint and production environment settings automatically.

`AZURE_STORAGE_TABLE_NAME` and `AZURE_STORAGE_TABLE_ENDPOINT` are optional. The
image defaults to the `AccessCodes` table and the standard storage endpoint.
Local development outside Docker continues to use `npm run dev` and `web/.env`.

## Deployment

Pushes to `main` that change the website build the static site and deploy it to
<https://benjaminderprogrammierer.github.io/ars-26-hackathon/>. The repository's
Pages source is configured as **GitHub Actions**.
The redeem route is server-rendered and is therefore only available in the App
Service deployment, not in the static Pages preview.
