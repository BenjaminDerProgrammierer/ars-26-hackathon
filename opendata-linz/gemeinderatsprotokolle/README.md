# Gemeinderatsprotokolle

> **Current status: REASSESS — DECISION PENDING.** The corpus was previously
> excluded from the usable bundle, but the full catalog review rated it A-tier
> and the stakeholder follow-up reopened the decision. Do not describe it as
> finally selected until Katharina and ME have reviewed it.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Gemeinderatsprotokolle 2026](https://www.data.gv.at/katalog/datasets/gemeinderatsprotokolle-2026), plus year-specific records in the catalog inventory |
| Format | Plain text for the reviewed recent records; PDF editions also exist for some years |
| Coverage | Year-specific council-session transcripts; the local inventory identifies plain-text records for 2014–2026 |
| Review depth | A-tier catalog/shortlist review; no dedicated hands-on corpus profile yet |
| Stakeholder owner | Katharina and ME to discuss at the next meeting |

## Why reconsider it

The recent corpus avoids PDF extraction and is unusually suitable for semantic
search, topic timelines, named-entity linking, passage-grounded summaries, and
LLM-assisted exploration. A public implementation already exists at
[politikdashboard.at](https://linz.politikdashboard.at/); it is both a product
reference and a possible mentor/contact lead. International parliamentary-data
projects should be reviewed for additional interface and citation patterns.

## Risks and preparation requirements

- Profile every year before selection: session count, encoding, speaker labels,
  headings, missing meetings, duplicate TXT/PDF editions, and stable source URLs.
- Preserve meeting, agenda item, speaker, and passage provenance. Every generated
  summary or answer must link back to the meeting and supporting passage.
- Political text requires neutral presentation, visible uncertainty, and human
  review. Do not infer intent, promises, ideology, or personal attributes.
- Confirm license and redistribution terms for the exact files included.
- Keep original text immutable and make chunking/embedding outputs reproducible.

## Decision gate

Katharina and ME should decide whether civic-memory work is in scope and whether
the team can provide a prepared, cited corpus rather than raw annual links. If
yes, run a hands-on audit and promote this to **USE WITH PREPARATION**. If not,
retain it as a documented optional project direction rather than silently
excluding an A-tier source.

## Sources

- [2026 catalog record](https://www.data.gv.at/katalog/datasets/gemeinderatsprotokolle-2026)
- [Full Linz catalog review](../archive/2026-07-13-reviews-benjamin/linz-dataset-review.csv)
- [Hackathon shortlist: Searchable civic memory](../archive/2026-07-13-reviews-benjamin/linz-hackathon-shortlist.md)
- [Existing Linz Politik Dashboard](https://linz.politikdashboard.at/)
