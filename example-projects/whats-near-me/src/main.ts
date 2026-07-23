import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "./style.css";
import { categoryInfo, loadPlaces, type Category, type Place } from "./data";

type Coordinates = { lat: number; lon: number; label: string };

const defaultOrigin: Coordinates = {
  lat: 48.305455,
  lon: 14.286804,
  label: "Hauptplatz, Linz",
};

const presets: Coordinates[] = [
  defaultOrigin,
  { lat: 48.309727, lon: 14.284314, label: "Ars Electronica Center" },
  { lat: 48.312216, lon: 14.298971, label: "Tabakfabrik" },
];

const categoryOrder: Category[] = ["water", "toilet", "wifi", "tree"];
const state = {
  origin: defaultOrigin,
  radius: 750,
  categories: new Set<Category>(categoryOrder),
  selectedId: "",
};

const places = await loadPlaces();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

app.innerHTML = `
  <header class="institutional-header">
    <a class="wordmark" href="../" aria-label="Back to example projects">ARS ELECTRONICA</a>
    <span>FESTIVAL 2026 // LINZ</span>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">OPEN CITY TOOL // PROTOTYPE 01</p>
      <h1>WHAT'S<br><strong>CLOSE?</strong></h1>
      <p class="hero-copy">Find useful public places around you—without an account or a backend.</p>
      <div class="location-actions">
        <button class="locate-button" id="locate" type="button">
          <span aria-hidden="true">◎</span> Use my location
        </button>
        <label class="preset-label">
          <span>or start at</span>
          <select id="preset" aria-label="Choose a starting point">
            ${presets.map((preset, index) => `<option value="${index}">${preset.label}</option>`).join("")}
          </select>
        </label>
      </div>
      <p class="location-status" id="location-status" aria-live="polite">
        Starting at <strong>${defaultOrigin.label}</strong>
      </p>
    </section>

    <section class="explorer" aria-labelledby="explore-heading">
      <div class="explorer-header">
        <div>
          <p class="eyebrow">LIVE IN YOUR BROWSER</p>
          <h2 id="explore-heading">Explore the radius</h2>
        </div>
        <label class="radius-control">
          <span>Search radius</span>
          <select id="radius">
            <option value="300">300 m</option>
            <option value="750" selected>750 m</option>
            <option value="1500">1.5 km</option>
            <option value="3000">3 km</option>
          </select>
        </label>
      </div>

      <div class="filters" id="filters" aria-label="Place categories">
        ${categoryOrder
          .map(
            (category) => `
              <label class="filter filter--${category}">
                <input type="checkbox" value="${category}" checked>
                <span class="filter-symbol" aria-hidden="true">${categoryInfo[category].symbol}</span>
                <span>
                  <strong>${categoryInfo[category].shortLabel}</strong>
                  <small>${categoryInfo[category].vintage}</small>
                </span>
              </label>`,
          )
          .join("")}
      </div>

      <div class="explorer-grid">
        <div class="radar-wrap">
          <div class="radar-heading">
            <span id="map-summary">Nearby places</span>
            <span>North ↑</span>
          </div>
          <div class="radar-stage">
            <svg
              class="radar"
              id="radar"
              viewBox="0 0 600 600"
              role="img"
              aria-labelledby="radar-title radar-description"
            >
              <title id="radar-title">Nearby public places</title>
              <desc id="radar-description">A street map centered on the selected location.</desc>
            </svg>
            <a
              class="map-attribution"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >© OpenStreetMap contributors</a>
          </div>
          <p class="map-note">Street-map tiles require an internet connection. Select a result for details.</p>
        </div>

        <section class="results-panel" aria-labelledby="results-heading">
          <div class="results-heading">
            <h3 id="results-heading">Nearest first</h3>
            <span id="result-count"></span>
          </div>
          <ol class="results" id="results"></ol>
          <button class="show-more" id="show-more" type="button">Show 12 more</button>
        </section>
      </div>
    </section>

    <section class="data-note">
      <p class="eyebrow">READ THE DATA HONESTLY</p>
      <div>
        <h2>Useful,<br>not infallible.</h2>
        <p>
          Locations come from City of Linz open data. Wi-Fi status, fountain operation,
          toilet opening hours, and accessibility details may have changed. Check signs
          on site and never use this prototype as emergency guidance.
        </p>
      </div>
    </section>
  </main>

  <footer>
    <strong>WHAT'S CLOSE?</strong>
    <p>Data: Stadt Linz, CC BY 4.0 · Prototype for Ars Electronica Festival 2026</p>
    <a href="https://www.data.gv.at/" target="_blank" rel="noreferrer">Explore the source catalog ↗</a>
  </footer>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required interface element not found: ${selector}`);
  return element;
}

const radar = requiredElement<SVGSVGElement>("#radar");
const results = requiredElement<HTMLOListElement>("#results");
const count = requiredElement<HTMLSpanElement>("#result-count");
const mapSummary = requiredElement<HTMLSpanElement>("#map-summary");
const showMore = requiredElement<HTMLButtonElement>("#show-more");
const status = requiredElement<HTMLParagraphElement>("#location-status");
const locateButton = requiredElement<HTMLButtonElement>("#locate");
const presetSelect = requiredElement<HTMLSelectElement>("#preset");
const radiusSelect = requiredElement<HTMLSelectElement>("#radius");
let visibleLimit = 12;

function distanceInMeters(origin: Coordinates, place: Place): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(place.lat - origin.lat);
  const longitudeDelta = toRadians(place.lon - origin.lon);
  const originLatitude = toRadians(origin.lat);
  const placeLatitude = toRadians(place.lat);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(placeLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearbyPlaces(): Place[] {
  return places
    .filter((place) => state.categories.has(place.category))
    .map((place) => ({ ...place, distance: distanceInMeters(state.origin, place) }))
    .filter((place) => place.distance <= state.radius)
    .sort((first, second) => first.distance - second.distance);
}

function formatDistance(distance: number): string {
  return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
}

function walkingMinutes(distance: number): string {
  return `${Math.max(1, Math.round(distance / 80))} min walk`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type MapView = {
  zoom: number;
  tileScale: number;
  centerX: number;
  centerY: number;
};

const tileUrlPattern = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function worldPixel(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const size = 256 * 2 ** zoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latitudeRadians = (latitude * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * size,
    y:
      ((1 -
        Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
        2) *
      size,
  };
}

function currentMapView(): MapView {
  const targetPixelsPerMeter = 250 / state.radius;
  const latitudeRadians = (state.origin.lat * Math.PI) / 180;
  const zoom = Math.round(
    Math.log2(156_543.033_92 * Math.cos(latitudeRadians) * targetPixelsPerMeter),
  );
  const nativeMetersPerPixel =
    (156_543.033_92 * Math.cos(latitudeRadians)) / 2 ** zoom;
  const tileScale = nativeMetersPerPixel * targetPixelsPerMeter;
  const center = worldPixel(state.origin.lat, state.origin.lon, zoom);
  return { zoom, tileScale, centerX: center.x, centerY: center.y };
}

function project(place: Place, view: MapView): { x: number; y: number } {
  const point = worldPixel(place.lat, place.lon, view.zoom);
  return {
    x: 300 + (point.x - view.centerX) * view.tileScale,
    y: 300 + (point.y - view.centerY) * view.tileScale,
  };
}

function mapTiles(view: MapView): string {
  const tileSize = 256 * view.tileScale;
  const firstX = Math.floor((view.centerX - 300 / view.tileScale) / 256);
  const lastX = Math.floor((view.centerX + 300 / view.tileScale) / 256);
  const firstY = Math.floor((view.centerY - 300 / view.tileScale) / 256);
  const lastY = Math.floor((view.centerY + 300 / view.tileScale) / 256);
  const tileCount = 2 ** view.zoom;
  const tiles: string[] = [];

  for (let tileY = firstY; tileY <= lastY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue;
    for (let tileX = firstX; tileX <= lastX; tileX += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      const href = tileUrlPattern
        .replace("{z}", String(view.zoom))
        .replace("{x}", String(wrappedX))
        .replace("{y}", String(tileY));
      const x = 300 + (tileX * 256 - view.centerX) * view.tileScale;
      const y = 300 + (tileY * 256 - view.centerY) * view.tileScale;
      tiles.push(
        `<image class="map-tile" href="${href}" x="${x}" y="${y}" width="${tileSize + 0.5}" height="${tileSize + 0.5}" />`,
      );
    }
  }

  return tiles.join("");
}

function marker(place: Place, view: MapView): string {
  const { x, y } = project(place, view);
  const selected = state.selectedId === place.id ? " is-selected" : "";
  const label = `${place.name}, ${formatDistance(place.distance)}`;

  if (place.category === "toilet") {
    return `<rect class="marker marker--toilet${selected}" data-id="${place.id}" tabindex="0" role="button" aria-label="${escapeHtml(label)}" x="${x - 7}" y="${y - 7}" width="14" height="14" />`;
  }
  if (place.category === "wifi") {
    return `<path class="marker marker--wifi${selected}" data-id="${place.id}" tabindex="0" role="button" aria-label="${escapeHtml(label)}" d="M ${x} ${y - 9} L ${x + 9} ${y + 8} L ${x - 9} ${y + 8} Z" />`;
  }
  if (place.category === "tree") {
    return `<circle class="marker marker--tree${selected}" data-id="${place.id}" tabindex="0" role="button" aria-label="${escapeHtml(label)}" cx="${x}" cy="${y}" r="5" />`;
  }
  return `<circle class="marker marker--water${selected}" data-id="${place.id}" tabindex="0" role="button" aria-label="${escapeHtml(label)}" cx="${x}" cy="${y}" r="7" />`;
}

function selectPlace(id: string): void {
  const index = nearbyPlaces().findIndex((place) => place.id === id);
  if (index >= visibleLimit) visibleLimit = index + 1;
  state.selectedId = id;
  render();
  document.querySelector<HTMLElement>(`[data-result-id="${CSS.escape(id)}"]`)?.focus();
}

function render(): void {
  const nearby = nearbyPlaces();
  const mapView = currentMapView();
  if (!nearby.some((place) => place.id === state.selectedId)) {
    state.selectedId = nearby[0]?.id ?? "";
  }

  const markerPlaces = nearby.filter(
    (place, index) => place.category !== "tree" || index < 500,
  );
  radar.innerHTML = `
    <title id="radar-title">Nearby public places</title>
    <desc id="radar-description">Street map showing ${nearby.length} places within ${formatDistance(state.radius)} of ${escapeHtml(state.origin.label)}.</desc>
    ${mapTiles(mapView)}
    <rect class="map-wash" x="0" y="0" width="600" height="600" />
    <circle class="radius-field" cx="300" cy="300" r="250" />
    <circle class="radius-line" cx="300" cy="300" r="250" />
    <circle class="radius-line radius-line--inner" cx="300" cy="300" r="166" />
    <circle class="radius-line radius-line--inner" cx="300" cy="300" r="83" />
    <line class="axis" x1="300" y1="50" x2="300" y2="550" />
    <line class="axis" x1="50" y1="300" x2="550" y2="300" />
    ${markerPlaces.map((place) => marker(place, mapView)).join("")}
    <circle class="origin-pulse" cx="300" cy="300" r="20" />
    <circle class="origin" cx="300" cy="300" r="8" />
  `;

  const shown = nearby.slice(0, visibleLimit);
  results.innerHTML =
    shown.length > 0
      ? shown
          .map((place, index) => {
            const info = categoryInfo[place.category];
            const selected = state.selectedId === place.id ? " is-selected" : "";
            return `
              <li>
                <button class="result${selected}" type="button" data-result-id="${place.id}">
                  <span class="result-number">${String(index + 1).padStart(2, "0")}</span>
                  <span class="result-body">
                    <small>${info.symbol} ${info.label}</small>
                    <strong>${escapeHtml(place.name)}</strong>
                    <span>${escapeHtml(place.detail)}</span>
                    ${place.meta ? `<em>${escapeHtml(place.meta)}</em>` : ""}
                  </span>
                  <span class="result-distance">
                    <strong>${formatDistance(place.distance)}</strong>
                    <small>${walkingMinutes(place.distance)}</small>
                  </span>
                </button>
              </li>`;
          })
          .join("")
      : `<li class="empty-state"><strong>Nothing in this radius.</strong><span>Try a larger radius or switch on another category.</span></li>`;

  count.textContent = `${nearby.length.toLocaleString()} found`;
  mapSummary.textContent = `${nearby.length.toLocaleString()} places // ${formatDistance(state.radius)}`;
  showMore.hidden = nearby.length <= visibleLimit;

  radar.querySelectorAll<SVGElement>(".marker").forEach((element) => {
    const id = element.dataset.id;
    if (!id) return;
    element.addEventListener("click", () => selectPlace(id));
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPlace(id);
      }
    });
  });

  results.querySelectorAll<HTMLButtonElement>(".result").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.resultId;
      if (id) selectPlace(id);
    });
  });
}

document.querySelectorAll<HTMLInputElement>('#filters input[type="checkbox"]').forEach((input) => {
  input.addEventListener("change", () => {
    const category = input.value as Category;
    if (input.checked) state.categories.add(category);
    else state.categories.delete(category);
    visibleLimit = 12;
    render();
  });
});

radiusSelect.addEventListener("change", () => {
  state.radius = Number(radiusSelect.value);
  visibleLimit = 12;
  render();
});

presetSelect.addEventListener("change", () => {
  const preset = presets[Number(presetSelect.value)];
  if (!preset) return;
  state.origin = preset;
  visibleLimit = 12;
  status.innerHTML = `Starting at <strong>${escapeHtml(preset.label)}</strong>`;
  render();
});

showMore.addEventListener("click", () => {
  visibleLimit += 12;
  render();
});

locateButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not available in this browser.";
    return;
  }

  locateButton.disabled = true;
  locateButton.innerHTML = `<span aria-hidden="true">◎</span> Finding you…`;
  status.textContent = "Requesting your location. It stays in this browser.";

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.origin = {
        lat: coords.latitude,
        lon: coords.longitude,
        label: "Your current location",
      };
      presetSelect.selectedIndex = -1;
      status.innerHTML = `Starting at <strong>Your current location</strong> · coordinates are not stored`;
      locateButton.disabled = false;
      locateButton.innerHTML = `<span aria-hidden="true">◎</span> Update my location`;
      visibleLimit = 12;
      render();
    },
    () => {
      status.textContent =
        "We could not access your location. Choose one of the Linz starting points instead.";
      locateButton.disabled = false;
      locateButton.innerHTML = `<span aria-hidden="true">◎</span> Try my location again`;
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
  );
});

render();
