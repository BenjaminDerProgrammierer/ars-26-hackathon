---
title: "Combining Festival and Linz Open Data"
description: "Join the festival's venues, times, and program with City of Linz open data — transit, events, environment, and maps."
order: 2
---

The festival dataset offers three natural hooks into city data: venue
**geo-coordinates** across Linz, an **event calendar** with times and
durations, and rich **bilingual text** with categories and artist countries.
This tutorial shows how to use each hook.

## Hook 1: Places

Festival venues are grouped into zones — OK QUARTER, MED CAMPUS, DANUBE
TRIANGLE, and further event locations. Combine venue coordinates with city
layers such as public transit stops, drinking fountains, or the tree register
to build maps and route planners.

## Hook 2: Times

Each calendar entry has a start time, duration, and language. Join against
the Linztermine city event calendar or transit departure data to answer
questions like *"how do I get from my current event to the next one in
time?"* — a classic festival-app idea.

## Hook 3: Content

Descriptions in German and English, project categories, and artist country
codes support content-driven mashups: multilingual guides, thematic
clustering, or statistics about the festival's international lineup.

## Coordinate systems

Some Linz datasets use the Austrian Gauss-Krüger projection (EPSG:31255)
instead of WGS84 — convert before mixing sources.

> Worked examples joining transit stops to festival venues will appear here
> before the event.
