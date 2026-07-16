---
title: "Combining Festival and Linz Open Data"
description: "Join the festival's venues, times, and program with City of Linz open data — transit, events, environment, and maps."
order: 2
---

The festival dataset offers three natural hooks into city data: venue
**coordinates**, an **event calendar**, and rich **bilingual text** with
categories and contact countries.

## Hook 1: Places

Festival venues are grouped into zones — OK QUARTER, MED CAMPUS, DANUBE
TRIANGLE, and further event locations. First correct or exclude known venue
coordinate outliers and inherit parent-building points where appropriate. Then
combine them with prepared WGS84 city layers such as the tree register, transit
stops, playgrounds, toilets, or drinking fountains.

## Hook 2: Times

Normalize festival calendar display strings into full Europe/Vienna datetimes,
then compare occurrence intervals with a cached Linztermine festival-window
snapshot. For mobility, static LINZ AG geometry can identify nearby stops while
a prepared EFA adapter supplies scheduled journeys. Do not describe static
geometry as a timetable or assume requested realtime data is actually live.

## Hook 3: Content

German and English descriptions, project categories, and contact country values
support multilingual guides, thematic clustering, or comparison with historical
tourism data. Preserve original text and provenance; a missing value is not an
editorial statement.

## Coordinate systems

Several shortlisted Linz datasets use the Austrian Gauss-Krüger projection
(EPSG:31255) instead of WGS84. Reproject them before mixing sources, validate
axis order against known Linz landmarks, and preserve source vintage and
license in every prepared output.

Use cached fallbacks for live services and keep dated, safety-related visitor
layers visibly marked as prototype data.
