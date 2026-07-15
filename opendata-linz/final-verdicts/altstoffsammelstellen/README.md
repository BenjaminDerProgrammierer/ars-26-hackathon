# Altstoffsammelstellen und Altstoffsammelzentren

> **Final verdict: DO NOT USE.** Neither cataloged CSV is anonymously
> downloadable. The publisher has confirmed that Linz AG does not intend to
> provide the data openly and plans to remove the catalog records.

## At a glance

| Item | Details |
|---|---|
| Publisher | Linz AG source links, cataloged through Stadt Linz open data |
| Catalog | [Altstoffsammelstellen](https://www.data.gv.at/katalog/datasets/162398d4-b2ea-4674-83d4-2c1d851a521a); [Altstoffsammelzentren](https://www.data.gv.at/katalog/datasets/7cbcdfa7-b7fd-4641-91c9-a6d67873b6a7) |
| Advertised access | `container.csv` and `asz.csv` on `services.linzag.at` |
| Actual access | HTTP 302 to Linz AG Keycloak; following the redirect returns an HTML login form |
| Data vintage | Catalog records last modified 2022-12-19 |
| Last verified | 2026-07-15; both dead CSV links and both still-published catalog records rechecked |

## Decision rationale

The datasets cannot be reproduced by hackathon teams without authentication,
and the source publisher does not plan to restore open access. Exclude them from
the bundle and discovery recommendations. Reassess only if a replacement public
distribution is published.

The stakeholder follow-up asked the hackathon team to contact LINZ AG directly
about LINZ AG-controlled data. A direct request for a current anonymous CSV/API
snapshot is therefore appropriate, but it does not soften the current **DO NOT
USE** verdict. Scraping the authenticated search application is not an open-data
replacement and should not be the default plan.

## Sources

- [Issue #19 and publisher response](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/19)
