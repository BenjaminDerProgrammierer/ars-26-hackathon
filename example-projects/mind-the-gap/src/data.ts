import festivalData from "./festival-projects.json";
import { parseCsv } from "./csv";

export type FestivalProject = {
  id: string;
  title: string;
  category: string;
  venue: string;
  address: string;
  lat: number;
  lon: number;
};

export type Tree = {
  id: string;
  name: string;
  botanicalName: string;
  height: number | null;
  crown: number | null;
  lat: number;
  lon: number;
};

export type Fountain = {
  id: string;
  name: string;
  kind: string;
  hours: string;
  lat: number;
  lon: number;
};

export const festivalProjects = festivalData.projects as FestivalProject[];
export const festivalSnapshotDate = festivalData.generated_from;

const treesUrl = new URL(
  "../../../opendata-linz/baumkataster/Baumkataster.csv",
  import.meta.url,
).href;
const fountainsUrl = new URL(
  "../../../opendata-linz/trinkbrunnen/Trinkbrunnen.csv",
  import.meta.url,
).href;

export async function loadTrees(): Promise<Tree[]> {
  const response = await fetch(treesUrl);
  if (!response.ok) throw new Error(`Could not load the Linz tree data (${response.status})`);

  return parseCsv(await response.text()).flatMap((row) => {
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const height = Number(row.Hoehe);
    const crown = Number(row.Schirmdurchmesser);
    return [
      {
        id: row.id,
        name: row.NameDeutsch || "City tree",
        botanicalName: [row.Gattung, row.Art, row.Sorte].filter(Boolean).join(" "),
        height: Number.isFinite(height) && height > 0 ? height : null,
        crown: Number.isFinite(crown) && crown > 0 ? crown : null,
        lat,
        lon,
      },
    ];
  });
}

export async function loadFountains(): Promise<Fountain[]> {
  const response = await fetch(fountainsUrl);
  if (!response.ok) {
    throw new Error(`Could not load the Linz drinking-water data (${response.status})`);
  }

  return parseCsv(await response.text()).flatMap((row) => {
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (
      row.trinkwasser !== "true" ||
      row.in_betrieb !== "true" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return [];
    }
    return [
      {
        id: row.id,
        name: row.aufstellungsort || "Drinking-water point",
        kind: row.brunnenart || "Drinking fountain",
        hours: row.betriebszeit || "",
        lat,
        lon,
      },
    ];
  });
}
