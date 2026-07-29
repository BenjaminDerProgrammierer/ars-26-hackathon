import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "./style.css";
import {
  festivalProjects,
  festivalSnapshotDate,
  loadTrees,
  type FestivalProject,
  type Tree,
} from "./data";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

const firstDefault = Math.max(
  0,
  festivalProjects.findIndex((project) => project.venue.includes("Ars Electronica Center")),
);
const secondDefault = Math.max(
  1,
  festivalProjects.findIndex((project) => project.venue.includes("Hauptplatz 8")),
);

function projectPicker(id: string, selectedIndex: number): string {
  const selected = festivalProjects[selectedIndex];
  if (!selected) throw new Error("Default festival project is unavailable");
  return `
    <div class="project-picker">
      <div class="project-search">
        <input
          id="${id}"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="${id}-results"
          autocomplete="off"
          spellcheck="false"
          value="${escapeHtml(selected.title)}"
        >
        <span aria-hidden="true">⌕</span>
      </div>
      <div class="project-results" id="${id}-results" role="listbox" hidden></div>
    </div>
  `;
}

app.innerHTML = `
  <header class="institutional-header">
    <a class="wordmark" href="../" aria-label="Back to example projects">ARS ELECTRONICA</a>
    <span>FESTIVAL 2026 // LINZ</span>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">A SMALL CITY ENCOUNTER</p>
      <h1>MIND<br>THE <strong>GAP</strong></h1>
      <div class="hero-intro">
        <p>Two festival events. One interval. Meet a living part of Linz on the way.</p>
        <a href="#planner">Plan the in-between ↓</a>
      </div>
    </section>

    <section class="planner" id="planner" aria-labelledby="planner-title">
      <div class="section-heading">
        <p class="eyebrow">YOUR FESTIVAL DAY</p>
        <h2 id="planner-title">What happens<br>between?</h2>
        <p>
          Pick two public festival projects and enter the times from your current
          program. We’ll keep enough time to walk and suggest a city tree on the way.
        </p>
      </div>

      <div class="event-pair">
        <article class="event-panel event-panel--from">
          <div class="event-number" aria-hidden="true">01</div>
          <label for="from-project">Your first event</label>
          ${projectPicker("from-project", firstDefault)}
          <label for="from-time">It ends at</label>
          <input id="from-time" type="datetime-local" value="2026-09-09T13:30">
          <div class="event-meta" id="from-meta"></div>
        </article>

        <div class="gap-marker" aria-hidden="true">
          <span>THE GAP</span>
          <b>→</b>
        </div>

        <article class="event-panel event-panel--to">
          <div class="event-number" aria-hidden="true">02</div>
          <label for="to-project">Your next event</label>
          ${projectPicker("to-project", secondDefault)}
          <label for="to-time">It starts at</label>
          <input id="to-time" type="datetime-local" value="2026-09-09T15:30">
          <div class="event-meta" id="to-meta"></div>
        </article>
      </div>

      <div class="calculation" id="calculation" aria-live="polite">
        <p>Loading the Linz tree inventory…</p>
      </div>
    </section>

    <section class="discovery" aria-labelledby="discovery-title">
      <div class="discovery-title">
        <p class="eyebrow">A DETOUR THAT FITS</p>
        <h2 id="discovery-title">Meet a<br>Linz tree.</h2>
      </div>
      <div class="route-map" id="route-map" aria-label="Street map of the selected route"></div>
      <div class="suggestions" id="suggestions"></div>
    </section>

    <section class="method">
      <p class="eyebrow">HOW TO READ THIS</p>
      <div>
        <h2>A possibility,<br>not a promise.</h2>
        <p>
          Walking times use straight-line distance with a 25% allowance—not street
          routing. The tree inventory records trees maintained by the City of Linz;
          it does not guarantee shade, access, or current conditions. Check your
          festival program and surroundings before setting off.
        </p>
      </div>
    </section>
  </main>

  <footer>
    <strong>MIND THE GAP</strong>
    <p>Festival snapshot: ${formatSnapshotDate(festivalSnapshotDate)} · Tree inventory: 1 July 2026</p>
    <span>Data: Ars Electronica & Stadt Linz</span>
  </footer>
`;

const fromSearch = requiredElement<HTMLInputElement>("#from-project");
const toSearch = requiredElement<HTMLInputElement>("#to-project");
const fromResults = requiredElement<HTMLDivElement>("#from-project-results");
const toResults = requiredElement<HTMLDivElement>("#to-project-results");
const fromTime = requiredElement<HTMLInputElement>("#from-time");
const toTime = requiredElement<HTMLInputElement>("#to-time");
const fromMeta = requiredElement<HTMLDivElement>("#from-meta");
const toMeta = requiredElement<HTMLDivElement>("#to-meta");
const calculation = requiredElement<HTMLDivElement>("#calculation");
const suggestions = requiredElement<HTMLDivElement>("#suggestions");
const routeMap = requiredElement<HTMLDivElement>("#route-map");

let trees: Tree[] = [];
let selectedTreeId = "";
let fromProjectIndex = firstDefault;
let toProjectIndex = secondDefault;

try {
  trees = await loadTrees();
} catch (error) {
  calculation.innerHTML = `<p class="error">${escapeHtml(error instanceof Error ? error.message : "Tree data unavailable")}</p>`;
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required interface element not found: ${selector}`);
  return element;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSnapshotDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "date unavailable"
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function project(index: number): FestivalProject {
  const selected = festivalProjects[index];
  if (!selected) throw new Error("Selected festival project is unavailable");
  return selected;
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

function fuzzyTermScore(needle: string, haystack: string): number | null {
  if (!needle) return 0;
  if (needle === haystack) return 1_000;
  if (haystack.startsWith(needle)) return 800 - (haystack.length - needle.length);
  const containedAt = haystack.indexOf(needle);
  if (containedAt >= 0) return 650 - containedAt * 3 - (haystack.length - needle.length);

  let needleIndex = 0;
  let firstMatch = -1;
  let previousMatch = -1;
  let gaps = 0;
  let consecutive = 0;
  for (let index = 0; index < haystack.length && needleIndex < needle.length; index += 1) {
    if (haystack[index] !== needle[needleIndex]) continue;
    if (firstMatch < 0) firstMatch = index;
    if (previousMatch === index - 1) consecutive += 1;
    if (previousMatch >= 0) gaps += index - previousMatch - 1;
    previousMatch = index;
    needleIndex += 1;
  }
  if (needleIndex !== needle.length) return null;
  return (
    350 -
    firstMatch * 3 -
    gaps * 5 -
    (haystack.length - needle.length) * 0.5 +
    consecutive * 12
  );
}

function projectSearchScore(item: FestivalProject, query: string): number | null {
  const terms = normalized(query)
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return 0;

  const fields = [
    { value: normalized(item.title), weight: 35 },
    { value: normalized(item.venue), weight: 20 },
    { value: normalized(item.category), weight: 10 },
  ];
  const targets = fields.flatMap((field) => [
    field,
    ...field.value.split(/[\s,()–—/-]+/).filter(Boolean).map((value) => ({
      value,
      weight: field.weight + 15,
    })),
  ]);

  let total = 0;
  for (const term of terms) {
    const scores = targets
      .map((target) => {
        const score = fuzzyTermScore(term, target.value);
        return score === null ? null : score + target.weight;
      })
      .filter((score): score is number => score !== null);
    if (scores.length === 0) return null;
    total += Math.max(...scores);
  }
  return total;
}

function setupProjectSearch(
  input: HTMLInputElement,
  results: HTMLDivElement,
  selectedIndex: () => number,
  setSelectedIndex: (index: number) => void,
): void {
  let matches: number[] = [];
  let activeResult = 0;

  const close = () => {
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };

  const choose = (index: number) => {
    const selected = project(index);
    setSelectedIndex(index);
    input.value = selected.title;
    selectedTreeId = "";
    close();
    render();
  };

  const show = (query = "") => {
    matches = festivalProjects
      .map((item, index) => ({ item, index, score: projectSearchScore(item, query) }))
      .filter(
        (match): match is { item: FestivalProject; index: number; score: number } =>
          match.score !== null,
      )
      .sort(
        (first, second) =>
          second.score - first.score ||
          first.item.title.localeCompare(second.item.title, "en"),
      )
      .slice(0, 8)
      .map(({ index }) => index);
    activeResult = Math.min(activeResult, Math.max(0, matches.length - 1));

    if (matches.length === 0) {
      results.innerHTML = `<p class="project-empty">No matching festival projects.</p>`;
    } else {
      results.innerHTML = matches
        .map((index, resultIndex) => {
          const item = project(index);
          const active = resultIndex === activeResult;
          return `
            <button
              id="${input.id}-option-${index}"
              class="project-result ${index === selectedIndex() ? "is-selected" : ""}"
              type="button"
              role="option"
              aria-selected="${index === selectedIndex()}"
              data-project-index="${index}"
              tabindex="${active ? "0" : "-1"}"
            >
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.venue)}</span>
              <small>${escapeHtml(item.category)}</small>
            </button>
          `;
        })
        .join("");
    }

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    const activeProjectIndex = matches[activeResult];
    if (activeProjectIndex !== undefined) {
      input.setAttribute("aria-activedescendant", `${input.id}-option-${activeProjectIndex}`);
    }
    results.querySelectorAll<HTMLButtonElement>("[data-project-index]").forEach((button) => {
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => choose(Number(button.dataset.projectIndex)));
    });
  };

  input.addEventListener("focus", () => show());
  input.addEventListener("input", () => {
    activeResult = 0;
    show(input.value);
  });
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      input.value = project(selectedIndex()).title;
      close();
    }, 100);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      input.select();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.hidden) show(input.value);
      if (matches.length === 0) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      activeResult = (activeResult + direction + matches.length) % matches.length;
      show(input.value);
      return;
    }
    if (event.key === "Enter" && !results.hidden) {
      const index = matches[activeResult];
      if (index !== undefined) {
        event.preventDefault();
        choose(index);
      }
    }
  });
}

function distance(
  first: Pick<FestivalProject | Tree, "lat" | "lon">,
  second: Pick<FestivalProject | Tree, "lat" | "lon">,
): number {
  const radius = 6_371_000;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.lat - first.lat);
  const longitudeDelta = radians(second.lon - first.lon);
  const firstLatitude = radians(first.lat);
  const secondLatitude = radians(second.lat);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkingMinutes(meters: number): number {
  return Math.max(1, Math.ceil((meters * 1.25) / 75));
}

function timeDifferenceMinutes(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) return 0;
  return Math.floor((endDate.valueOf() - startDate.valueOf()) / 60_000);
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function eventMeta(item: FestivalProject): string {
  return `
    <strong>${escapeHtml(item.category)}</strong>
    <span>${escapeHtml(item.venue)}</span>
    <small>${escapeHtml(item.address)}</small>
  `;
}

type Candidate = {
  tree: Tree;
  walkMinutes: number;
  pauseMinutes: number;
  routeMeters: number;
};

function findCandidates(
  from: FestivalProject,
  to: FestivalProject,
  gapMinutes: number,
): Candidate[] {
  return trees
    .map((tree) => {
      const routeMeters = distance(from, tree) + distance(tree, to);
      const walkMinutes = walkingMinutes(routeMeters);
      return { tree, routeMeters, walkMinutes, pauseMinutes: gapMinutes - walkMinutes };
    })
    .filter((candidate) => candidate.pauseMinutes >= 10)
    .sort(
      (first, second) =>
        first.routeMeters - second.routeMeters ||
        (second.tree.crown ?? 0) - (first.tree.crown ?? 0),
    )
    .slice(0, 5);
}

function directionsUrl(from: FestivalProject, tree: Tree, to: FestivalProject): string {
  const route = `${from.lat},${from.lon};${tree.lat},${tree.lon};${to.lat},${to.lon}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${encodeURIComponent(route)}`;
}

type MapPoint = Pick<FestivalProject | Tree, "lat" | "lon">;

type WalkingRoute = {
  points: MapPoint[];
  distanceMeters: number;
  durationSeconds: number;
};

type OsrmResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> };
  }>;
};

const walkingRouteCache = new Map<string, WalkingRoute>();
let walkingRouteController: AbortController | null = null;
let walkingRouteRequestId = 0;

function worldPixel(point: MapPoint, zoom: number): { x: number; y: number } {
  const size = 256 * 2 ** zoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, point.lat));
  const latitudeRadians = (latitude * Math.PI) / 180;
  return {
    x: ((point.lon + 180) / 360) * size,
    y:
      ((1 -
        Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
        2) *
      size,
  };
}

function mapView(points: MapPoint[]): {
  zoom: number;
  center: { x: number; y: number };
} {
  for (let zoom = 17; zoom >= 11; zoom -= 1) {
    const projected = points.map((point) => worldPixel(point, zoom));
    const minX = Math.min(...projected.map((point) => point.x));
    const maxX = Math.max(...projected.map((point) => point.x));
    const minY = Math.min(...projected.map((point) => point.y));
    const maxY = Math.max(...projected.map((point) => point.y));
    if (maxX - minX <= 470 && maxY - minY <= 245) {
      return {
        zoom,
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      };
    }
  }
  const projected = points.map((point) => worldPixel(point, 11));
  return {
    zoom: 11,
    center: {
      x: (Math.min(...projected.map((point) => point.x)) + Math.max(...projected.map((point) => point.x))) / 2,
      y: (Math.min(...projected.map((point) => point.y)) + Math.max(...projected.map((point) => point.y))) / 2,
    },
  };
}

function mapTiles(zoom: number, center: { x: number; y: number }): string {
  const tileCount = 2 ** zoom;
  const firstX = Math.floor((center.x - 300) / 256);
  const lastX = Math.floor((center.x + 300) / 256);
  const firstY = Math.floor((center.y - 185) / 256);
  const lastY = Math.floor((center.y + 185) / 256);
  const tiles: string[] = [];

  for (let y = firstY; y <= lastY; y += 1) {
    if (y < 0 || y >= tileCount) continue;
    for (let x = firstX; x <= lastX; x += 1) {
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      tiles.push(`
        <image
          class="map-tile"
          href="https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png"
          x="${x * 256 - center.x + 300}"
          y="${y * 256 - center.y + 185}"
          width="256"
          height="256"
        />
      `);
    }
  }
  return tiles.join("");
}

function routeKey(points: MapPoint[]): string {
  return points.map((point) => `${point.lon.toFixed(6)},${point.lat.toFixed(6)}`).join(";");
}

async function fetchWalkingRoute(
  waypoints: MapPoint[],
  signal: AbortSignal,
): Promise<WalkingRoute> {
  const coordinates = routeKey(waypoints);
  const url =
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordinates}` +
    "?overview=full&geometries=geojson&steps=false&continue_straight=false";
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing service returned ${response.status}`);
  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) {
    throw new Error(data.message || "No walking route was found");
  }
  return {
    points: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

function renderStreetMap(
  from: FestivalProject,
  to: FestivalProject,
  tree: Tree | undefined,
  route: WalkingRoute | undefined,
  status: "loading" | "ready" | "unavailable",
): void {
  const markers = tree ? [from, tree, to] : [from, to];
  const mapPoints = route ? [...markers, ...route.points] : markers;
  const view = mapView(mapPoints);
  const plot = (point: MapPoint) => {
    const projected = worldPixel(point, view.zoom);
    return {
      x: 300 + projected.x - view.center.x,
      y: 185 + projected.y - view.center.y,
    };
  };
  const plottedMarkers = markers.map(plot);
  const path = route?.points.map(plot).map((point) => `${point.x},${point.y}`).join(" ");
  const description = tree
    ? "OpenStreetMap walking route from the first event, via the suggested tree, to the second event"
    : "Street map between the selected events";
  const caption =
    status === "ready" && route
      ? `Walking route · ${formatDistance(route.distanceMeters)} · ${Math.max(1, Math.round(route.durationSeconds / 60))} min`
      : status === "loading"
        ? "Finding the walking route…"
        : "Walking route unavailable · showing locations only";

  routeMap.innerHTML = `
    <div class="map-frame">
      <svg viewBox="0 0 600 370" role="img" aria-label="${description}">
        ${mapTiles(view.zoom, view.center)}
        <rect class="map-wash" width="600" height="370"/>
        ${
          path
            ? `<polyline class="route-line route-line--outline" points="${path}"/><polyline class="route-line" points="${path}"/>`
            : ""
        }
        ${
          tree
            ? `<circle class="tree-point" cx="${plottedMarkers[1]?.x}" cy="${plottedMarkers[1]?.y}" r="18"/><text x="${plottedMarkers[1]?.x}" y="${(plottedMarkers[1]?.y ?? 0) + 5}" text-anchor="middle">✦</text>`
            : ""
        }
        <circle class="event-point" cx="${plottedMarkers[0]?.x}" cy="${plottedMarkers[0]?.y}" r="15"/>
        <text class="event-label" x="${plottedMarkers[0]?.x}" y="${(plottedMarkers[0]?.y ?? 0) + 5}" text-anchor="middle">01</text>
        <circle class="event-point" cx="${plottedMarkers.at(-1)?.x}" cy="${plottedMarkers.at(-1)?.y}" r="15"/>
        <text class="event-label" x="${plottedMarkers.at(-1)?.x}" y="${(plottedMarkers.at(-1)?.y ?? 0) + 5}" text-anchor="middle">02</text>
      </svg>
      <a
        class="map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >© OpenStreetMap contributors</a>
    </div>
    <p>${caption}</p>
  `;
  routeMap.setAttribute("aria-busy", String(status === "loading"));
}

function updateRoutedSuggestion(tree: Tree, route: WalkingRoute, gapMinutes: number): void {
  const button = [...suggestions.querySelectorAll<HTMLButtonElement>("[data-tree-id]")].find(
    (candidate) => candidate.dataset.treeId === tree.id,
  );
  const routedMinutes = Math.max(1, Math.round(route.durationSeconds / 60));
  const timing = button?.querySelector<HTMLElement>(".suggestion-time");
  if (timing) {
    timing.innerHTML = `${routedMinutes} min routed walk<br><b>${Math.max(0, gapMinutes - routedMinutes)} min to pause</b>`;
  }
  const detail = suggestions.querySelector<HTMLElement>(".selected-detail p");
  if (detail) {
    detail.textContent = [
      tree.height ? `${tree.height} m recorded height` : "",
      tree.crown ? `${tree.crown} m crown diameter` : "",
      `${formatDistance(route.distanceMeters)} routed distance`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
}

function renderMap(
  from: FestivalProject,
  to: FestivalProject,
  tree?: Tree,
  gapMinutes = 0,
): void {
  const waypoints = tree ? [from, tree, to] : [from, to];
  const key = routeKey(waypoints);
  const cached = walkingRouteCache.get(key);
  const requestId = ++walkingRouteRequestId;
  walkingRouteController?.abort();

  if (cached) {
    renderStreetMap(from, to, tree, cached, "ready");
    if (tree) updateRoutedSuggestion(tree, cached, gapMinutes);
    return;
  }

  renderStreetMap(from, to, tree, undefined, "loading");
  walkingRouteController = new AbortController();
  void fetchWalkingRoute(waypoints, walkingRouteController.signal)
    .then((route) => {
      walkingRouteCache.set(key, route);
      if (requestId === walkingRouteRequestId) {
        renderStreetMap(from, to, tree, route, "ready");
        if (tree) updateRoutedSuggestion(tree, route, gapMinutes);
      }
    })
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (requestId === walkingRouteRequestId) {
        renderStreetMap(from, to, tree, undefined, "unavailable");
      }
    });
}

function render(): void {
  const from = project(fromProjectIndex);
  const to = project(toProjectIndex);
  const gapMinutes = timeDifferenceMinutes(fromTime.value, toTime.value);
  const directMeters = distance(from, to);
  const directMinutes = walkingMinutes(directMeters);
  const candidates = findCandidates(from, to, gapMinutes);
  const selected =
    candidates.find((candidate) => candidate.tree.id === selectedTreeId) ?? candidates[0];
  selectedTreeId = selected?.tree.id ?? "";

  fromMeta.innerHTML = eventMeta(from);
  toMeta.innerHTML = eventMeta(to);

  if (gapMinutes <= 0) {
    calculation.innerHTML = `
      <div class="calculation-value">NO GAP</div>
      <p>The second event must start after the first one ends.</p>
    `;
  } else {
    calculation.innerHTML = `
      <div class="calculation-value">${gapMinutes}<small>MIN</small></div>
      <p>
        ${formatDistance(directMeters)} between venues · about ${directMinutes} min direct walking
        ${gapMinutes < directMinutes ? " · <strong>These events are probably too close together.</strong>" : ""}
      </p>
    `;
  }

  if (candidates.length === 0) {
    suggestions.innerHTML = `
      <div class="empty-state">
        <strong>No responsible detour fits.</strong>
        <p>Keep this interval for the direct walk, or give yourself more time between events.</p>
      </div>
    `;
    renderMap(from, to, undefined, gapMinutes);
    return;
  }

  suggestions.innerHTML = candidates
    .map(
      (candidate, index) => `
        <button
          class="suggestion ${candidate.tree.id === selected?.tree.id ? "is-selected" : ""}"
          type="button"
          data-tree-id="${escapeHtml(candidate.tree.id)}"
          aria-pressed="${candidate.tree.id === selected?.tree.id}"
        >
          <span class="suggestion-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="suggestion-copy">
            <strong>${escapeHtml(candidate.tree.name)}</strong>
            <small><i>${escapeHtml(candidate.tree.botanicalName)}</i></small>
          </span>
          <span class="suggestion-time">${candidate.walkMinutes} min walk<br><b>${candidate.pauseMinutes} min to pause</b></span>
        </button>
      `,
    )
    .join("");

  if (selected) {
    const facts = [
      selected.tree.height ? `${selected.tree.height} m recorded height` : "",
      selected.tree.crown ? `${selected.tree.crown} m crown diameter` : "",
      `${formatDistance(selected.routeMeters)} via the tree`,
    ]
      .filter(Boolean)
      .join(" · ");
    suggestions.insertAdjacentHTML(
      "beforeend",
      `
        <div class="selected-detail">
          <p>${escapeHtml(facts)}</p>
          <a href="${directionsUrl(from, selected.tree, to)}" target="_blank" rel="noreferrer">
            Check the walking route ↗
          </a>
        </div>
      `,
    );
    renderMap(from, to, selected.tree, gapMinutes);
  }

  suggestions.querySelectorAll<HTMLButtonElement>("[data-tree-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTreeId = button.dataset.treeId ?? "";
      render();
    });
  });
}

[fromTime, toTime].forEach((element) => {
  element.addEventListener("change", () => {
    selectedTreeId = "";
    render();
  });
});

setupProjectSearch(
  fromSearch,
  fromResults,
  () => fromProjectIndex,
  (index) => {
    fromProjectIndex = index;
  },
);
setupProjectSearch(
  toSearch,
  toResults,
  () => toProjectIndex,
  (index) => {
    toProjectIndex = index;
  },
);

render();
