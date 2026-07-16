---
title: "Festival 2026 Program Export"
summary: "The current Negotiating Humanity program export as one JSON file: projects, contacts, locations, and calendar rows."
provider: "Ars Electronica"
url: "https://ars.electronica.art/negotiatinghumanity/hackathondata/"
group: "festival"
order: 1
---

One JSON export (~2 MB) straight from the festival's content system. The
current snapshot contains **546 projects**, **240 contacts**, **111 locations**,
and **178 calendar rows**, plus bilingual descriptions, categories, ticket
requirements, and venue coordinates. Refreshed exports are published at the
same URL as the program evolves.

Treat it as a working CMS export, not a clean public API: test/internal records
are mixed in, some location and calendar IDs are absent or duplicated, and the
calendar side is authoritative for project times. Normalize IDs to their
trailing 32-character hash and validate coordinates before joining.
