import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = join(webRoot, "..");

const datasetFiles = [
  ["baulandreserven-2022", "Baulandreserven.json"],
  ["baumkataster", "Baumkataster.csv"],
  ["defibrillatoren", "Defibrillatoren.csv"],
  ["hecken-die-schmecken", "Hecken-die-schmecken.csv"],
  ["herkunftslaender-gaeste", "Herkunftslaender.csv"],
  ["hotspots", "Hotspot-Nutzung.csv"],
  ["hotspots", "Hotspot-Standorte.csv"],
  ["hundezonen", "HUNDEZONEN.json"],
  ["kurzparkzonen", "Kurzparkzone_30min_20220621.json"],
  ["kurzparkzonen", "Kurzparkzone_90min_Area_20220621.json"],
  ["kurzparkzonen", "Kurzparkzone_90min_Line_20220621.json"],
  ["kurzparkzonen", "Kurzparkzone_180min_20220621.json"],
  ["kurzparkzonen", "Kurzparkzone_Grenze_20220621.json"],
  ["linztermine", "Linztermine.json"],
  ["strassennamen", "Strassennamen-aktuell.csv"],
  ["strassennamen", "Strassennamen-historisch.csv"],
  ["trinkbrunnen", "Trinkbrunnen.csv"],
  ["wc-anlagen", "WC-Anlagen.csv"],
];

await Promise.all(
  datasetFiles.map(async ([dataset, filename]) => {
    const source = join(repositoryRoot, "opendata-linz", dataset, filename);
    const destination = join(webRoot, "public", "datasets", dataset, filename);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }),
);

console.log(`Hosted ${datasetFiles.length} prepared dataset files.`);
