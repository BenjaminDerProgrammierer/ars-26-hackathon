import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
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
] as const;

async function syncDatasets() {
  await Promise.all(
    datasetFiles.map(async ([dataset, filename]) => {
      const source = join(repositoryRoot, "opendata-linz", dataset, filename);
      const destination = join(
        webRoot,
        "public",
        "datasets",
        dataset,
        filename,
      );
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }),
  );

  console.log(`Hosted ${datasetFiles.length} prepared dataset files.`);
}

async function syncExampleProjects() {
  const projectsRoot = join(repositoryRoot, "example-projects");
  const projects = (await readdir(projectsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const downloadsRoot = join(webRoot, "public", "downloads");
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ars-example-projects-"));
  await mkdir(downloadsRoot, { recursive: true });

  try {
    await Promise.all(
      projects.map(async (project) => {
        const filename = `${project}.zip`;
        const archive = join(temporaryRoot, filename);

        await run(
          "zip",
          [
            "-rq",
            archive,
            join("example-projects", project),
            "-x",
            "*/node_modules/*",
            "*/dist/*",
            "*/__pycache__/*",
            "*.pyc",
            "*.pyo",
            "*.DS_Store",
          ],
          { cwd: repositoryRoot },
        );
        await copyFile(archive, join(downloadsRoot, filename));
      }),
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }

  console.log(`Hosted ${projects.length} zipped example projects.`);
}

await Promise.all([syncDatasets(), syncExampleProjects()]);
