# Hackathon AI proxy prototype

A standalone Node.js/TypeScript service that gives each contestant an account,
an API key, an OpenAI-compatible chat-completions endpoint, and a strict $20
usage ledger backed by OpenRouter.

The configured model is `mistralai/mistral-medium-3-5`: an open-weight model
from Paris-based Mistral AI. Contestants cannot select a different upstream
model.

## What is implemented

- Email/password accounts and cookie sessions via Better Auth
- Contestant API keys shown once, SHA-256 hashed with a server-side pepper at rest,
  and immediately revocable by rotating them
- `POST /v1/chat/completions` and `GET /v1/models`, compatible with OpenAI clients
- Non-streaming and SSE streaming pass-through
- Atomic budget reservations that prevent concurrent requests from racing past
  the cap, followed by reconciliation against OpenRouter's `usage.cost`
- Text-only requests and a configurable output-token cap, which make the
  pre-request maximum cost conservative and enforceable
- Contestant dashboard with balance and request history
- Admin dashboard with usage inspection and budget resets
- SQLite persistence for a zero-infrastructure prototype

## Set up

Requirements: Node.js 20, 22, or 24 and build tools supported by
`better-sqlite3`. Node.js 26 is not supported by the pinned SQLite native addon.

```bash
cd ai-proxy
npm install
cp .env.example .env
```

Fill in `.env`. Use independent random values for `BETTER_AUTH_SECRET` and
`API_KEY_PEPPER`; never put the OpenRouter key in a tracked file.

Create Better Auth's SQLite tables once, then start the service:

```bash
npm run db:migrate-auth
npm run dev
```

Open `http://localhost:8787`, create an account, and issue an API key. An email
listed in `ADMIN_EMAILS` sees the admin controls after signing in.

## Connect an OpenAI client

Use the base URL shown in the dashboard. For example:

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ARS_HACKATHON_API_KEY,
  baseURL: "http://localhost:8787/v1",
});

const completion = await client.chat.completions.create({
  model: "hackathon-model",
  messages: [{ role: "user", content: "Suggest an open-data prototype for Linz." }],
});

console.log(completion.choices[0].message.content);
```

The full model ID also works. Other model IDs and image inputs are rejected.

## Budget behavior

Money is stored as integer nano-dollars, avoiding floating-point drift. Before
an upstream call, the service reserves the maximum possible text-request cost
using the request's UTF-8 size, a framing allowance, current input pricing, and
the enforced output-token maximum. SQLite `BEGIN IMMEDIATE` transactions make
the check atomic across simultaneous requests.

After completion, the reservation is replaced with OpenRouter's actual
`usage.cost`. Streaming responses are read through their final usage chunk even
if the contestant disconnects. If provider usage is unexpectedly missing or the
network outcome is ambiguous, the full reservation is charged and marked
`estimated`; this fail-closed behavior protects the hard cap.

Pricing is configuration, because OpenRouter prices can change. Verify and
update `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` before
the event.

## Prototype boundaries

- SQLite is suitable for one service process. Move the same ledger operations
  to PostgreSQL before horizontally scaling.
- Email ownership is not verified in this prototype. Add verification or use an
  organizer-controlled participant allowlist before public registration.
- Add deployment-level TLS, backups, request logging/monitoring, and signup rate
  limiting before exposing the service publicly.
- The implemented OpenAI surface is Chat Completions, not every OpenAI endpoint.

## Commands

```bash
npm run dev             # development server with reload
npm test                # unit and proxy integration tests
npm run check           # TypeScript check
npm run build           # compile production output
npm start               # run the compiled service
```
