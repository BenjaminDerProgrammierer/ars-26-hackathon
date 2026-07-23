import { parseCsv, type CsvRow } from "./csv";

const dataUrls = {
  fountains: new URL(
    "../../../opendata-linz/trinkbrunnen/Trinkbrunnen.csv",
    import.meta.url,
  ).href,
  toilets: new URL(
    "../../../opendata-linz/wc-anlagen/WC-Anlagen.csv",
    import.meta.url,
  ).href,
  hotspots: new URL(
    "../../../opendata-linz/hotspots/Hotspot-Standorte.csv",
    import.meta.url,
  ).href,
  trees: new URL(
    "../../../opendata-linz/baumkataster/Baumkataster.csv",
    import.meta.url,
  ).href,
};

export type Category = "water" | "toilet" | "wifi" | "tree";

export type Place = {
  id: string;
  category: Category;
  name: string;
  detail: string;
  meta: string;
  lat: number;
  lon: number;
  distance: number;
};

export const categoryInfo: Record<
  Category,
  { label: string; shortLabel: string; symbol: string; vintage: string }
> = {
  water: {
    label: "Drinking water",
    shortLabel: "Water",
    symbol: "●",
    vintage: "2023",
  },
  toilet: {
    label: "Public toilets",
    shortLabel: "Toilets",
    symbol: "■",
    vintage: "2023/24",
  },
  wifi: {
    label: "Public Wi-Fi",
    shortLabel: "Wi-Fi",
    symbol: "▲",
    vintage: "2022",
  },
  tree: {
    label: "City trees",
    shortLabel: "Trees",
    symbol: "✦",
    vintage: "2026",
  },
};

function coordinate(row: CsvRow): { lat: number; lon: number } | null {
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function booleanLabel(value: string, yes: string): string {
  return value === "true" ? yes : "";
}

async function fetchCsv(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load open data (${response.status})`);
  return response.text();
}

export async function loadPlaces(): Promise<Place[]> {
  const [fountainsCsv, toiletsCsv, hotspotsCsv, treesCsv] = await Promise.all(
    Object.values(dataUrls).map(fetchCsv),
  );

  const fountains: Place[] = parseCsv(fountainsCsv).flatMap((row) => {
    const point = coordinate(row);
    if (!point || row.trinkwasser !== "true") return [];
    return [
      {
        id: row.id,
        category: "water",
        name: row.aufstellungsort || "Drinking fountain",
        detail: row.bauart || row.brunnenart || "Public drinking-water point",
        meta: [booleanLabel(row.in_betrieb, "listed as operational"), row.betriebszeit]
          .filter(Boolean)
          .join(" · "),
        ...point,
        distance: 0,
      },
    ];
  });

  const toilets: Place[] = parseCsv(toiletsCsv).flatMap((row) => {
    const point = coordinate(row);
    if (!point) return [];
    return [
      {
        id: row.id,
        category: "toilet",
        name: row.name || "Public toilet",
        detail: row.art || "Public toilet",
        meta: [
          booleanLabel(row.barrierefrei, "accessible"),
          booleanLabel(row.wickeltisch, "changing table"),
          row.oeffnungszeiten,
        ]
          .filter(Boolean)
          .join(" · "),
        ...point,
        distance: 0,
      },
    ];
  });

  const hotspots: Place[] = parseCsv(hotspotsCsv).flatMap((row) => {
    const point = coordinate(row);
    if (!point) return [];
    return [
      {
        id: row.id,
        category: "wifi",
        name: row.name || "Public Wi-Fi",
        detail: [row.strasse, [row.plz, row.stadt].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        meta: `Status in 2022: ${row.status_2022 || "unknown"}`,
        ...point,
        distance: 0,
      },
    ];
  });

  const trees: Place[] = parseCsv(treesCsv).flatMap((row) => {
    const point = coordinate(row);
    if (!point) return [];
    const botanicalName = [row.Gattung, row.Art, row.Sorte].filter(Boolean).join(" ");
    return [
      {
        id: row.id,
        category: "tree",
        name: row.NameDeutsch || botanicalName || "City tree",
        detail: botanicalName || "Municipal tree",
        meta: [
          row.Hoehe ? `${row.Hoehe} m high` : "",
          row.Schirmdurchmesser ? `${row.Schirmdurchmesser} m crown diameter` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        ...point,
        distance: 0,
      },
    ];
  });

  return [...fountains, ...toilets, ...hotspots, ...trees];
}
