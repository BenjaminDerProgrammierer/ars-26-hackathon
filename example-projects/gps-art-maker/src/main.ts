import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  createIcons,
  Download,
  Droplets,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Toilet,
  Upload,
} from "lucide";
import fountainCsv from "../../../opendata-linz/trinkbrunnen/Trinkbrunnen.csv?raw";
import toiletCsv from "../../../opendata-linz/wc-anlagen/WC-Anlagen.csv?raw";
import "./style.css";
import { parseCsv } from "./csv";

type Point = { x: number; y: number };
type Fountain = { name: string; lat: number; lon: number; hours: string };
type Toilet = {
  name: string;
  lat: number;
  lon: number;
  hours: string;
  accessible: boolean;
};
type RouteStep = {
  name: string;
  distance: number;
  maneuver: { type: string; modifier?: string };
};
type OsrmResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs: Array<{ steps: RouteStep[] }>;
  }>;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

app.innerHTML = `
  <header class="institutional-header">
    <a href="../" class="wordmark" aria-label="Back to example projects">ARS ELECTRONICA</a>
    <span>FESTIVAL 2026 // LINZ</span>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">OPEN CITY TOOL // PROTOTYPE 02</p>
      <h1>GPS ART<br><strong>MAKER.</strong></h1>
      <div class="hero-intro">
        <p>Give the city your line. Upload a picture and discover which streets to walk to draw it with your movement.</p>
        <a href="#maker">Make a route <i data-lucide="arrow-down" aria-hidden="true"></i></a>
      </div>
      <p class="hero-meta">YOUR PICTURE · LINZ STREETS · ONE CONTINUOUS WALK</p>
    </section>

    <section class="maker" id="maker" aria-labelledby="maker-title">
      <div class="section-heading">
        <p class="eyebrow">01 // CHOOSE YOUR SHAPE</p>
        <h2 id="maker-title">What do you<br>want to draw?</h2>
      </div>

      <div class="workspace">
        <div class="upload-panel">
          <label class="drop-zone" id="drop-zone">
            <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
            <i class="upload-mark" data-lucide="upload" aria-hidden="true"></i>
            <strong>Drop a picture here</strong>
            <span>or choose a PNG, JPG, WEBP or SVG</span>
          </label>
          <div class="privacy-note">
            <i data-lucide="shield-check" aria-hidden="true"></i>
            <p><strong>Stays on this device.</strong><br>Your picture is processed in the browser and is never uploaded.</p>
          </div>
          <button class="sample-button" id="sample-button" type="button">Try the heart example <i data-lucide="arrow-right" aria-hidden="true"></i></button>
        </div>

        <div class="image-stage" id="image-stage">
          <div class="image-placeholder">
            <span>YOUR IMAGE</span>
            <svg viewBox="0 0 320 260" aria-hidden="true">
              <path d="M160 224C137 197 58 146 58 91c0-31 21-53 50-53 24 0 42 13 52 34 10-21 28-34 52-34 29 0 50 22 50 53 0 55-79 106-102 133Z"/>
            </svg>
          </div>
          <img id="image-preview" alt="" />
          <div class="image-caption">
            <span id="image-name">Example: heart.svg</span>
            <span id="image-status">READY TO TRACE</span>
          </div>
        </div>
      </div>

      <div class="controls">
        <label>
          <span><i data-lucide="map-pin" aria-hidden="true"></i> Start near</span>
          <select id="start-point">
            <option value="hauptplatz">Hauptplatz</option>
            <option value="aec">Ars Electronica Center</option>
            <option value="volksgarten">Volksgarten</option>
          </select>
        </label>
        <label>
          <span><i data-lucide="route" aria-hidden="true"></i> Target distance</span>
          <select id="distance">
            <option value="4" selected>Approx. 4 km</option>
            <option value="7">Approx. 7 km</option>
            <option value="10">Approx. 10 km</option>
          </select>
        </label>
        <button class="create-button" id="create-route" type="button">Create my route <i data-lucide="sparkles" aria-hidden="true"></i></button>
      </div>
    </section>

    <section class="result" id="result" aria-labelledby="result-title">
      <div class="result-heading">
        <div>
          <p class="eyebrow">02 // WALK THE LINE</p>
          <h2 id="result-title">Your route<br>through Linz.</h2>
        </div>
        <p id="result-copy">A continuous loop shaped from your image and routed along mapped walking ways.</p>
      </div>

      <div class="route-layout">
        <div class="map-panel">
          <div class="map-topline">
            <strong>ROUTE PREVIEW</strong>
            <span>NORTH ↑</span>
          </div>
          <div
            id="route-map"
            role="region"
            aria-label="Interactive OpenStreetMap showing the GPS art route and nearby drinking fountains"
          ></div>
          <div class="map-legend">
            <span><i class="legend-route"></i> GPS art route</span>
            <span><i class="legend-amenity legend-amenity--water" data-lucide="droplets"></i> Drinking fountain</span>
            <span><i class="legend-amenity legend-amenity--toilet" data-lucide="toilet"></i> Public toilet</span>
          </div>
        </div>

        <aside class="route-details">
          <div class="route-stats">
            <div><strong id="route-distance">7.2</strong><span>KM</span></div>
            <div><strong id="route-time">1:34</strong><span>EST. TIME</span></div>
            <div><strong id="route-streets">12</strong><span>STREETS</span></div>
          </div>
          <div class="directions">
            <div class="directions-title">
              <h3>Walk these streets</h3>
              <span>IN ORDER</span>
            </div>
            <ol id="directions-list"></ol>
          </div>
          <button class="download-button" id="download-gpx" type="button">Download GPX file <i data-lucide="download" aria-hidden="true"></i></button>
          <p class="safety-copy">The line follows mapped pedestrian streets and paths, but it is not turn-by-turn navigation. Check current crossings and closures before walking. Fountain and toilet data is from 2023 and may be outdated.</p>
        </aside>
      </div>
    </section>

    <section class="manifesto">
      <p class="eyebrow">A CITY IS ALSO A CANVAS</p>
      <p>THE IMAGE ONLY APPEARS<br><strong>AFTER YOU MOVE.</strong></p>
    </section>
  </main>

  <footer>
    <strong>GPS ART MAKER</strong>
    <p>Browser prototype for Ars Electronica Festival 2026</p>
    <a href="#maker">Make another route <i data-lucide="arrow-up" aria-hidden="true"></i></a>
  </footer>

  <canvas id="processing-canvas" width="240" height="240" hidden></canvas>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required interface element not found: ${selector}`);
  return element;
}

const result = requiredElement<HTMLElement>("#result");
const fileInput = requiredElement<HTMLInputElement>("#file-input");
const preview = requiredElement<HTMLImageElement>("#image-preview");
const imageStage = requiredElement<HTMLDivElement>("#image-stage");
const imageName = requiredElement<HTMLSpanElement>("#image-name");
const imageStatus = requiredElement<HTMLSpanElement>("#image-status");
const distanceSelect = requiredElement<HTMLSelectElement>("#distance");
const startSelect = requiredElement<HTMLSelectElement>("#start-point");
const createButton = requiredElement<HTMLButtonElement>("#create-route");
const downloadButton = requiredElement<HTMLButtonElement>("#download-gpx");
const canvas = requiredElement<HTMLCanvasElement>("#processing-canvas");
const processingContext = canvas.getContext("2d", { willReadFrequently: true });
if (!processingContext) throw new Error("Canvas is not supported");

const interfaceIcons = {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Download,
  Droplets,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Toilet,
  Upload,
};

function hydrateIcons(): void {
  createIcons({
    attrs: {
      "aria-hidden": "true",
      "stroke-width": 2,
    },
    icons: interfaceIcons,
  });
}

const startPoints: Record<string, L.LatLngTuple> = {
  hauptplatz: [48.305455, 14.286804],
  aec: [48.309727, 14.284314],
  volksgarten: [48.298239, 14.291142],
};

// Drawing centers are offset from the requested starting landmark so the
// silhouette stays within one dense, connected pedestrian area. Centering a
// heart directly on Hauptplatz, for example, puts half of it across the Danube
// and forces the router to repeatedly return to a bridge.
const drawingCenters: Record<string, L.LatLngTuple> = {
  hauptplatz: [48.3004, 14.2912],
  aec: [48.3152, 14.2848],
  volksgarten: [48.2972, 14.2925],
};

let currentPoints: Point[] = heartPoints();
let currentObjectUrl = "";
let currentRoutedCoordinates: L.LatLngTuple[] = [];
let routeLayer: L.Polyline | undefined;
let fountainLayer: L.LayerGroup | undefined;
let toiletLayer: L.LayerGroup | undefined;
let routeRequestId = 0;

const fountains: Fountain[] = parseCsv(fountainCsv)
  .filter(
    (row) =>
      row.lat &&
      row.lon &&
      row.in_betrieb === "true" &&
      row.trinkwasser === "true",
  )
  .map((row) => ({
    name: row.aufstellungsort || "Drinking fountain",
    lat: Number(row.lat),
    lon: Number(row.lon),
    hours: row.betriebszeit || "No hours stated",
  }));

const toilets: Toilet[] = parseCsv(toiletCsv)
  .filter((row) => row.lat && row.lon)
  .map((row) => ({
    name: row.name || "Public toilet",
    lat: Number(row.lat),
    lon: Number(row.lon),
    hours: row.oeffnungszeiten || "No hours stated",
    accessible: row.barrierefrei === "true",
  }));

const map = L.map("route-map", {
  center: [48.305, 14.286],
  zoom: 14,
  zoomControl: true,
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Amenities: Stadt Linz, CC BY 4.0',
}).addTo(map);

function heartPoints(): Point[] {
  const points: Point[] = [];
  for (let index = 0; index <= 180; index += 1) {
    const angle = (index / 180) * Math.PI * 2;
    const x = 16 * Math.sin(angle) ** 3;
    const y =
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle);
    points.push({ x: 400 + x * 14, y: 355 - y * 13 });
  }
  return points;
}

function fitPoints(points: Point[]): Point[] {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(490 / Math.max(1, maxX - minX), 330 / Math.max(1, maxY - minY));
  return points.map((point) => ({
    x: 400 + (point.x - (minX + maxX) / 2) * scale,
    y: 390 + (point.y - (minY + maxY) / 2) * scale,
  }));
}

function pointsToCoordinates(points: Point[]): L.LatLngTuple[] {
  const [centerLat, centerLon] =
    drawingCenters[startSelect.value] ?? drawingCenters.hauptplatz;
  // The walking route becomes longer than the raw silhouette because every
  // waypoint is connected along the pedestrian network. This calibration keeps
  // the routed result close to the selected target distance in central Linz.
  const sizeFactor = 0.452 * Math.sqrt(Number(distanceSelect.value) / 4);
  return fitPoints(points).map((point) => [
    centerLat + ((390 - point.y) / 620) * 0.035 * sizeFactor,
    centerLon + ((point.x - 400) / 800) * 0.055 * sizeFactor,
  ]);
}

function routeWaypoints(points: Point[]): L.LatLngTuple[] {
  const coordinates = pointsToCoordinates(points);
  // A smaller set preserves the main silhouette turns while avoiding tiny
  // out-and-back legs to adjacent street segments.
  const waypointCount = Math.min(16, coordinates.length);
  const sampled = Array.from({ length: waypointCount }, (_, index) => {
    const coordinateIndex = Math.floor((index / waypointCount) * coordinates.length);
    return coordinates[coordinateIndex];
  }).filter((coordinate): coordinate is L.LatLngTuple => coordinate !== undefined);

  const origin = L.latLng(
    startPoints[startSelect.value] ?? startPoints.hauptplatz,
  );
  const closestIndex = sampled.reduce(
    (bestIndex, coordinate, index) =>
      origin.distanceTo(L.latLng(coordinate)) <
      origin.distanceTo(L.latLng(sampled[bestIndex] ?? coordinate))
        ? index
        : bestIndex,
    0,
  );
  const ordered = [...sampled.slice(closestIndex), ...sampled.slice(0, closestIndex)];
  if (ordered[0]) ordered.push(ordered[0]);
  return ordered;
}

function distanceToSegment(
  point: L.LatLng,
  start: L.LatLng,
  end: L.LatLng,
): number {
  const latitudeScale = 111_320;
  const longitudeScale = 111_320 * Math.cos((point.lat * Math.PI) / 180);
  const px = point.lng * longitudeScale;
  const py = point.lat * latitudeScale;
  const ax = start.lng * longitudeScale;
  const ay = start.lat * latitudeScale;
  const bx = end.lng * longitudeScale;
  const by = end.lat * latitudeScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
    : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToRoute(fountain: Fountain, route: L.LatLng[]): number {
  const point = L.latLng(fountain.lat, fountain.lon);
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < route.length; index += 1) {
    const start = route[index - 1];
    const end = route[index];
    if (start && end) nearest = Math.min(nearest, distanceToSegment(point, start, end));
  }
  return nearest;
}

function nearbyRouteAmenities<T extends { lat: number; lon: number }>(
  amenities: T[],
  route: L.LatLng[],
): Array<{ amenity: T; distance: number }> {
  return amenities
    .map((amenity) => ({
      amenity,
      distance: distanceToRoute(
        { name: "", hours: "", lat: amenity.lat, lon: amenity.lon },
        route,
      ),
    }))
    .filter(({ distance }) => distance <= 450)
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 12);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maneuverLabel(step: RouteStep): string {
  const modifier = step.maneuver.modifier?.replaceAll("_", " ");
  if (step.maneuver.type === "depart") return "Start";
  if (step.maneuver.type === "arrive") return "Finish";
  if (step.maneuver.type === "continue") return "Continue";
  if (modifier) return `Turn ${modifier}`;
  return step.maneuver.type.replaceAll("_", " ");
}

function renderRoute(
  coordinates: L.LatLngTuple[],
  distanceMeters: number,
  durationSeconds: number,
  steps: RouteStep[],
): void {
  currentRoutedCoordinates = coordinates;
  const route = coordinates.map(([lat, lon]) => L.latLng(lat, lon));

  if (routeLayer) routeLayer.remove();
  routeLayer = L.polyline(coordinates, {
    color: "#d51a5e",
    weight: 7,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  if (fountainLayer) fountainLayer.remove();
  fountainLayer = L.layerGroup().addTo(map);
  const nearbyFountains = nearbyRouteAmenities(fountains, route);
  const fountainIcon = L.divIcon({
    className: "amenity-dot amenity-dot--fountain",
    html: '<i data-lucide="droplets" aria-hidden="true"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
  for (const { amenity: fountain, distance: routeDistance } of nearbyFountains) {
    L.marker([fountain.lat, fountain.lon], {
      icon: fountainIcon,
      title: `Drinking fountain: ${fountain.name}`,
    })
      .bindPopup(
        `<strong>${escapeHtml(fountain.name)}</strong><br>Listed hours: ${escapeHtml(fountain.hours)}<br><small>${Math.round(routeDistance)} m from the route · Verify on site</small>`,
      )
      .addTo(fountainLayer);
  }

  if (toiletLayer) toiletLayer.remove();
  toiletLayer = L.layerGroup().addTo(map);
  const nearbyToilets = nearbyRouteAmenities(toilets, route);
  const toiletIcon = L.divIcon({
    className: "amenity-dot amenity-dot--toilet",
    html: '<i data-lucide="toilet" aria-hidden="true"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
  for (const { amenity: toilet, distance: routeDistance } of nearbyToilets) {
    L.marker([toilet.lat, toilet.lon], {
      icon: toiletIcon,
      title: `Public toilet: ${toilet.name}`,
    })
      .bindPopup(
        `<strong>${escapeHtml(toilet.name)}</strong><br>Listed hours: ${escapeHtml(toilet.hours)}<br>Accessible: ${toilet.accessible ? "listed as yes" : "not listed as accessible"}<br><small>${Math.round(routeDistance)} m from the route · Verify on site</small>`,
      )
      .addTo(toiletLayer);
  }
  hydrateIcons();

  if (coordinates.length) {
    map.fitBounds(L.latLngBounds(coordinates), { padding: [55, 55] });
  }

  const distance = distanceMeters / 1000;
  requiredElement<HTMLElement>("#route-distance").textContent = distance.toFixed(1);
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  requiredElement<HTMLElement>("#route-time").textContent = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  const usefulSteps = steps
    .filter((step) => step.distance >= 15)
    .filter(
      (step, index, allSteps) =>
        index === 0 ||
        step.name !== allSteps[index - 1]?.name ||
        step.maneuver.type !== allSteps[index - 1]?.maneuver.type,
    );
  const streetCount = new Set(usefulSteps.map((step) => step.name).filter(Boolean)).size;
  requiredElement<HTMLElement>("#route-streets").textContent = String(streetCount);
  requiredElement<HTMLOListElement>("#directions-list").innerHTML = usefulSteps
    .slice(0, 20)
    .map(
      (step, index) =>
        `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(step.name || "Unnamed walking path")}</strong><small>${escapeHtml(maneuverLabel(step))}</small></li>`,
    )
    .join("");
  const startLabel = startSelect.options[startSelect.selectedIndex]?.text ?? "Hauptplatz";
  requiredElement<HTMLElement>("#result-copy").textContent =
    `A ${distance.toFixed(1)} km pedestrian-routed loop beginning near ${startLabel}, shaped from your image.`;
  downloadButton.disabled = false;
}

async function updateRoute(): Promise<boolean> {
  const requestId = ++routeRequestId;
  const waypoints = routeWaypoints(currentPoints);
  const coordinateString = waypoints
    .map(([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
    .join(";");
  const routeUrl =
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordinateString}` +
    "?overview=full&geometries=geojson&steps=true&continue_straight=false";

  createButton.disabled = true;
  downloadButton.disabled = true;
  createButton.firstChild!.textContent = "Routing on footpaths… ";
  imageStatus.textContent = "FINDING WALKING WAYS";

  try {
    const response = await fetch(routeUrl);
    if (!response.ok) throw new Error(`Routing service returned ${response.status}`);
    const data = (await response.json()) as OsrmResponse;
    const routed = data.routes?.[0];
    if (data.code !== "Ok" || !routed) {
      throw new Error(data.message || "No walkable route could be found");
    }
    if (requestId !== routeRequestId) return false;

    const coordinates = routed.geometry.coordinates.map(
      ([lon, lat]): L.LatLngTuple => [lat, lon],
    );
    const steps = routed.legs.flatMap((leg) => leg.steps);
    renderRoute(coordinates, routed.distance, routed.duration, steps);
    imageStatus.textContent = "STREET ROUTE READY";
    return true;
  } catch (error) {
    if (requestId !== routeRequestId) return false;
    currentRoutedCoordinates = [];
    if (routeLayer) routeLayer.remove();
    routeLayer = undefined;
    imageStatus.textContent = "ROUTING UNAVAILABLE";
    requiredElement<HTMLElement>("#result-copy").textContent =
      error instanceof Error
        ? `${error.message}. Try again in a moment.`
        : "The walking route could not be created. Try again in a moment.";
    return false;
  } finally {
    if (requestId === routeRequestId) {
      createButton.disabled = false;
      createButton.firstChild!.textContent = "Create my route ";
    }
  }
}

function traceImage(image: HTMLImageElement): Point[] {
  const context = processingContext;
  if (!context) return heartPoints();
  const size = 240;
  context.clearRect(0, 0, size, size);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, size, size);
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight) * 0.88;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  const pixels = context.getImageData(0, 0, size, size).data;
  const points: Point[] = [];
  const center = size / 2;

  for (let degree = 0; degree < 360; degree += 2) {
    const angle = (degree * Math.PI) / 180;
    let bestRadius = 22;
    for (let radius = 20; radius < 112; radius += 2) {
      const x = Math.round(center + Math.cos(angle) * radius);
      const y = Math.round(center + Math.sin(angle) * radius);
      const offset = (y * size + x) * 4;
      const alpha = pixels[offset + 3] ?? 0;
      const luminance = ((pixels[offset] ?? 255) + (pixels[offset + 1] ?? 255) + (pixels[offset + 2] ?? 255)) / 3;
      if (alpha > 40 && luminance < 215) bestRadius = radius;
    }
    points.push({
      x: center + Math.cos(angle) * bestRadius,
      y: center + Math.sin(angle) * bestRadius,
    });
  }
  return points;
}

function loadFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    imageStatus.textContent = "PLEASE CHOOSE AN IMAGE";
    return;
  }
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    currentPoints = traceImage(image);
    preview.src = currentObjectUrl;
    preview.alt = `Uploaded image: ${file.name}`;
    imageStage.classList.add("has-image");
    imageName.textContent = file.name;
    imageStatus.textContent = "SILHOUETTE FOUND";
    void updateRoute();
  };
  image.onerror = () => {
    imageStatus.textContent = "IMAGE COULD NOT BE READ";
  };
  image.src = currentObjectUrl;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) loadFile(file);
});

const dropZone = requiredElement<HTMLElement>("#drop-zone");
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const file = event.dataTransfer?.files[0];
  if (file) loadFile(file);
});

requiredElement<HTMLButtonElement>("#sample-button").addEventListener("click", () => {
  currentPoints = heartPoints();
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = "";
  preview.removeAttribute("src");
  preview.alt = "";
  imageStage.classList.remove("has-image");
  imageName.textContent = "Example: heart.svg";
  imageStatus.textContent = "READY TO TRACE";
  void updateRoute();
});

createButton.addEventListener("click", async () => {
  const created = await updateRoute();
  if (created) {
    result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
});

distanceSelect.addEventListener("change", () => void updateRoute());
startSelect.addEventListener("change", () => void updateRoute());

downloadButton.addEventListener("click", () => {
  const gpxPoints = currentRoutedCoordinates.map(
    ([latitude, longitude]) =>
      `<trkpt lat="${latitude.toFixed(6)}" lon="${longitude.toFixed(6)}"></trkpt>`,
  );
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Art Maker Prototype" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>GPS Art Maker // Linz</name></metadata>
  <trk><name>GPS Art Route</name><trkseg>${gpxPoints.join("")}</trkseg></trk>
</gpx>`;
  const url = URL.createObjectURL(new Blob([gpx], { type: "application/gpx+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gps-art-linz.gpx";
  link.click();
  URL.revokeObjectURL(url);
});

void updateRoute();
hydrateIcons();
