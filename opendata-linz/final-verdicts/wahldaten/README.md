# Wahldaten

> **Final verdict: OPTIONAL, WITH PREPARATION.** The catalog contains strong
> machine-readable election series and precinct boundaries, but correct
> year-specific joins and neutral interpretation require a prepared bundle.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Core geometry | [Wahlsprengel Linz](https://www.data.gv.at/katalog/datasets/09660c57-9e8c-4ac5-bd2f-32f3c6961f72) |
| Example results | [Nationalratswahlen](https://www.data.gv.at/katalog/datasets/5f125543-f032-46e1-901d-05cd7b5678e6) |
| Other reviewed series | Mayoral, municipal, state, presidential, European, and national elections |
| Formats | CSV result tables and Shapefile precinct boundaries; some PDF duplicates exist |
| Review depth | B-tier catalog/shortlist review; no dedicated hands-on normalized bundle yet |

## Suitable uses

- Turnout and result maps using the correct precinct geometry for each election.
- Longitudinal city-level or comparable-area views with explicit boundary breaks.
- A transparent democracy explorer that exposes source tables and calculations.

## Preparation requirements and limits

1. Select machine-readable CSV editions and exclude PDF-only duplicates.
2. Match each election to the boundary vintage created for that election; never
   assume precinct IDs or shapes are stable across years.
3. Profile columns, party/candidate naming changes, special precincts, postal
   votes, nulls, totals, and join coverage before publishing.
4. Publish raw counts, denominators, turnout formulas, source year, and boundary
   provenance alongside derived percentages.
5. Avoid ecological claims about individual voters or neighborhoods. Use neutral
   language and clearly separate observation from interpretation.

## Decision rationale

The data supports a strong civic project, but it is less directly connected to
the festival program than the default city layers and is easy to misjoin across
changing precincts. It should be offered only as an optional prepared democracy
bundle, not as a folder of raw election files.

## Sources

- [Full Linz catalog review](../../2026-07-13-reviews-benjamin/linz-dataset-review.csv)
- [Hackathon shortlist: Democracy map](../../2026-07-13-reviews-benjamin/linz-hackathon-shortlist.md)
