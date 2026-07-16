# Ars Electronica Festival 2026 — AI Hackathon

Materials for the AI hackathon at [Ars Electronica Festival 2026](https://ars.electronica.art/negotiatinghumanity/en/)
(*Future Begins / Negotiating Humanity*, September 2026, Linz). Participants
build apps that combine the festival's program data with open data from the
City of Linz.

## What's here

| Folder | Contents |
| --- | --- |
| [`web/`](web/) | The hackathon website (Astro, EN/DE). `cd web && npm install && npm run dev` |
| [`ai-proxy/`](ai-proxy/) | Prototype account portal and OpenAI-compatible Mistral proxy with a strict $20 contestant budget |
| [`ars-dataset/`](ars-dataset/) | Snapshot folder for the festival dataset export (the JSON file itself is gitignored; see the folder README for the download link) |
| [`opendata-linz/`](opendata-linz/) | Research on City of Linz open-data sets worth combining with the festival data, including ~30 per-dataset reviews |
| `.agents/skills/` | Agent skills: work with the dataset (`ars-dataset`), design in the festival's visual language (`design-ars-festival-ui`) |

## Website quick reference

Inside `web/`: `npm run dev` (dev server), `npm run build` (static build to
`dist/`), `npm run check` (types + lint), `npm run format`.
Page content lives as Markdown in `web/src/content/` — one file per page and
language, so editing text needs no code changes.
