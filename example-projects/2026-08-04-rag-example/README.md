# Ars Festival RAG Search

A small, inspectable command-line example of semantic search and
retrieval-augmented generation (RAG) over the public Ars Electronica Festival
2026 project dataset. It uses OpenRouter for embeddings and generation, while a
plain JSON file and in-memory cosine similarity keep the retrieval mechanics
visible.

The example has two stages:

1. `search` embeds a question and finds semantically similar festival projects.
2. `ask` gives only those retrieved records to a generation model and requests
   an answer with numbered sources.

Vectors select text; they are never sent to the generation model as context.

## Setup

Requirements: Node.js 22 or newer, npm, and the repository's current
`ars-dataset/notion_export.json` snapshot.

```sh
cd example-projects/2026-08-04-rag-example
npm install
cp .env.example .env
```

Set `OPENROUTER_API_KEY` in `.env`. The default embedding model is
`mistralai/mistral-embed-2312`, and the default completion model is
`mistralai/mistral-medium-3-5` (Mistral Medium 3.5). Both models must be allowed
by the same OpenRouter key or guardrail.

Embedding the full dataset consumes API credits. Generated vectors and prepared
records are gitignored so credentials, stale indexes, and copied dataset content
are not committed.

## Run the example

```sh
npm run prepare-data
npm run build-index
npm run search -- "art about machine consciousness"
npm run ask -- "Which projects explore AI and human identity?"
```

`prepare-data` reads `../../ars-dataset/notion_export.json` by default. Optional
input and output paths can be passed directly:

```sh
npm run prepare-data -- /path/to/notion_export.json data/documents.json
npm run build-index -- data/documents.json data/vector-index.json
```

Search prints project titles and cosine scores, making the retrieval evidence
separately inspectable. `ask` then prints a constrained model answer followed by
the exact retrieved public sources. Links appear only when the source record has
`link_allowed: true`.

Use `RAG_RESULT_LIMIT` and `RAG_MIN_SIMILARITY` to tune retrieval. The defaults
are five projects and `0.25`; evaluate that threshold with representative
questions before using the example in a demo.

## How it works

Data preparation filters projects on `public_for_hackathon === true`, joins
locations using the 32-character `canonical_id`, and creates separate English
and German chunks. Metadata such as title, category, artists, and location is
repeated in each chunk. URLs are retained only when `link_allowed === true`.

Index building sends document chunks to OpenRouter in batches and records the
actual vector dimension, dataset timestamp, schema version, embedding model, and
document-builder version in the index manifest. Search refuses to use an index
built with a different embedding model. At this dataset size, scanning a JSON
index is sufficient; a vector database would obscure more than it teaches.

For RAG, the best chunk per project is retained so one long project cannot fill
all result slots. The generation prompt says to use only those records, cite
them as `[1]`, `[2]`, and admit when they do not support an answer.

## Tests

```sh
npm test
npm run typecheck
```

Tests use deterministic fake vectors and generation responses. They do not need
credentials or spend OpenRouter credits. They cover visibility and URL rules,
canonical location joins, vector validation, transient retries, cosine ranking,
project deduplication, model mismatch detection, prompt confinement, and the
insufficient-information path.

## Important limitations

- Embedding similarity is not factual certainty, and RAG can still hallucinate.
- Search quality depends on chunking, language, the embedding model, and the
  chosen similarity threshold.
- An index becomes stale when the export or document-building rules change.
  Re-run preparation and indexing whenever either changes.
- Changing `OPENROUTER_EMBEDDING_MODEL` requires rebuilding the index. Vector
  dimensions are discovered from responses rather than hard-coded.
- OpenRouter errors fail the command; the example never silently falls back to
  an unsupported answer.
- Calendar and timetable questions are intentionally unsupported. The current
  dataset contract has known calendar relation issues, and this example indexes
  projects only.
- Public visibility is enforced before indexing and again before prompt
  construction. Never weaken those checks to recover filtered records.
- Keep OpenRouter keys in server-side or CLI environments, never browser code.

This example implements [issue #71](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/71).
