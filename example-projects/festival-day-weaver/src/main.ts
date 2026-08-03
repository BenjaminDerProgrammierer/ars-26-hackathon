import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "./style.css";
import {
  calendarEvents,
  festivalSnapshotDate,
  loadServices,
  projects,
  type FestivalEvent,
  type FestivalProject,
  type ServiceKind,
  type ServicePlace,
} from "./data";

type PlannedEvent = {
  key: string;
  projectId: string;
  start: string;
  end: string;
  arrivalMinutes: number;
};

type Transfer = {
  from: PlannedEvent;
  to: PlannedEvent;
  distance: number;
  walkMinutes: number;
  availableMinutes: number;
  departure: string;
  slackMinutes: number;
  service: ServicePlace | null;
  serviceDetourMinutes: number;
};

const projectById = new Map(projects.map((project) => [project.id, project]));
const calendarEventById = new Map(calendarEvents.map((event) => [event.id, event]));
const calendarEventsByProject = new Map<string, FestivalEvent[]>();
for (const event of calendarEvents) {
  const projectEvents = calendarEventsByProject.get(event.project_id) ?? [];
  projectEvents.push(event);
  calendarEventsByProject.set(event.project_id, projectEvents);
}
for (const projectEvents of calendarEventsByProject.values()) {
  projectEvents.sort((first, second) => first.start.localeCompare(second.start));
}
const storageKey = "festival-day-weaver-plan-v1";
const state = {
  plan: loadPlan(),
  services: [] as ServicePlace[],
  serviceKinds: new Set<ServiceKind>(["water", "toilet"]),
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

app.innerHTML = `
  <header class="institutional-header">
    <a class="wordmark" href="../" aria-label="Back to example projects">ARS ELECTRONICA</a>
    <span>FESTIVAL 2026 // LINZ</span>
  </header>
  <nav class="local-nav" aria-label="Day Weaver">
    <a href="#planner">Build your day</a>
    <a href="#route">Route view</a>
    <a href="#method">How it works</a>
  </nav>

  <main>
    <section class="hero">
      <div class="hero-title">
        <p class="eyebrow">FESTIVAL PLANNING TOOL // 08–13 SEPTEMBER 2026</p>
        <h1>DAY<br><strong>WEAVER</strong></h1>
      </div>
      <div class="hero-intro">
        <p class="hero-lead">One day. Many places. Enough time to move, arrive, drink, and breathe.</p>
        <a class="hero-action" href="#planner">Start weaving ↓</a>
        <dl>
          <div><dt>${projects.length}</dt><dd>public projects<br>with mapped venues</dd></div>
          <div><dt>${calendarEvents.length}</dt><dd>trustworthy public<br>calendar slots</dd></div>
        </dl>
      </div>
    </section>

    <section class="data-status" aria-labelledby="data-status-title">
      <p class="eyebrow">DATA STATUS // ${formatSnapshotDate(festivalSnapshotDate)}</p>
      <div>
        ${calendarEvents.length > 0
          ? `<h2 id="data-status-title">Choose a slot.<br>We’ll weave the route.</h2>
             <p>
               This snapshot includes ${calendarEvents.length} trustworthy public calendar
               ${calendarEvents.length === 1 ? "slot" : "slots"}. Choose a project to use its
               official program time, or enter a time manually when no slot is available.
             </p>`
          : `<h2 id="data-status-title">Bring the time.<br>We’ll weave the route.</h2>
             <p>
               The current public export has festival projects and venues, but its public
               calendar rows do not resolve to public projects. Choose an event below and
               enter the time shown in the official program. We won’t turn hidden test
               records into a schedule.
             </p>`}
      </div>
    </section>

    <section class="planner" id="planner" aria-labelledby="planner-title">
      <header class="section-heading">
        <p class="eyebrow">01 // CHOOSE</p>
        <h2 id="planner-title">Build your<br>festival day</h2>
        <p>Add at least two events. Your route is sorted by time automatically.</p>
      </header>

      <div class="planner-grid">
        <form class="event-form" id="event-form">
          <div class="form-index" aria-hidden="true">+</div>
          <div class="field field--wide">
            <label for="project">Festival project</label>
            <div class="project-picker">
              <input
                id="project"
                name="project"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="project-results"
                aria-activedescendant=""
                autocomplete="off"
                placeholder="Start typing a title…"
                required
              >
              <span class="search-symbol" aria-hidden="true">⌕</span>
              <div class="project-results" id="project-results" role="listbox" hidden></div>
            </div>
            <p class="field-hint" id="project-hint">Choose a title from the public festival dataset.</p>
          </div>
          <div class="field field--wide">
            <label for="calendar-slot">Program time</label>
            <select id="calendar-slot" name="calendar-slot" disabled>
              <option value="manual">Choose a project to see official slots</option>
            </select>
            <p class="field-hint" id="calendar-slot-hint">You can always enter a time manually below.</p>
          </div>
          <div class="field field--start">
            <label for="start">Starts</label>
            <input id="start" name="start" type="datetime-local" value="2026-09-09T10:00" required>
          </div>
          <div class="field">
            <label for="end">Ends</label>
            <input id="end" name="end" type="datetime-local" value="2026-09-09T11:00" required>
          </div>
          <div class="field">
            <label for="arrival">Arrive early</label>
            <select id="arrival" name="arrival">
              <option value="0">At start time</option>
              <option value="5">5 minutes</option>
              <option value="10" selected>10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
          <button class="add-button" type="submit">Add to my day <span aria-hidden="true">→</span></button>
          <p class="form-message" id="form-message" aria-live="polite"></p>
        </form>

        <div class="plan-column">
          <div class="plan-tools">
            <h3>Your draft</h3>
            <button id="clear-plan" class="text-button" type="button">Clear all</button>
          </div>
          <div id="timeline" class="timeline" aria-live="polite"></div>
        </div>
      </div>
    </section>

    <section class="route-section" id="route" aria-labelledby="route-title">
      <header class="route-heading">
        <div>
          <p class="eyebrow">02 // MOVE</p>
          <h2 id="route-title">See the<br>whole weave</h2>
        </div>
        <fieldset class="service-controls">
          <legend>Suggest along the way</legend>
          <label><input type="checkbox" value="water" checked> <span class="service-symbol service-symbol--water" aria-hidden="true">●</span> Drinking water</label>
          <label><input type="checkbox" value="toilet" checked> <span class="service-symbol service-symbol--toilet" aria-hidden="true">■</span> Public toilets</label>
        </fieldset>
      </header>
      <div class="route-grid">
        <div class="route-map" id="route-map" aria-live="polite"></div>
        <div class="route-legend">
          <p>Not a street map</p>
          <span>Geographic overview of your selected venues and suggested service stops.</span>
        </div>
      </div>
    </section>

    <section class="method" id="method" aria-labelledby="method-title">
      <p class="eyebrow">03 // CHECK</p>
      <div>
        <h2 id="method-title">A useful draft,<br>not a promise.</h2>
        <div class="method-copy">
          <p>
            Walking time uses straight-line distance plus a 25% street allowance.
            “Leave by” also reserves your chosen arrival buffer. Longer transfers
            include a pre-filled EFA public-transport query.
          </p>
          <p>
            Fountain and toilet records are City of Linz snapshots from 2023/24.
            Opening, operation, accessibility, and festival times may have changed.
            Check the official program, route, signs, and surroundings.
          </p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <strong>FESTIVAL DAY WEAVER</strong>
    <p>Festival snapshot: ${formatSnapshotDate(festivalSnapshotDate)} · City service data: 2023/24</p>
    <span>Data: Ars Electronica & Stadt Linz // Prototype, not navigation</span>
  </footer>
`;

const form = requiredElement<HTMLFormElement>("#event-form");
const projectInput = requiredElement<HTMLInputElement>("#project");
const projectResults = requiredElement<HTMLDivElement>("#project-results");
const projectHint = requiredElement<HTMLParagraphElement>("#project-hint");
const calendarSlotSelect = requiredElement<HTMLSelectElement>("#calendar-slot");
const calendarSlotHint = requiredElement<HTMLParagraphElement>("#calendar-slot-hint");
const startInput = requiredElement<HTMLInputElement>("#start");
const endInput = requiredElement<HTMLInputElement>("#end");
const arrivalSelect = requiredElement<HTMLSelectElement>("#arrival");
const formMessage = requiredElement<HTMLParagraphElement>("#form-message");
const timeline = requiredElement<HTMLDivElement>("#timeline");
const routeMap = requiredElement<HTMLDivElement>("#route-map");
const clearPlan = requiredElement<HTMLButtonElement>("#clear-plan");
let selectedProjectId = "";
let activeProjectIndex = -1;
let visibleProjects: FestivalProject[] = [];

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
    ? "snapshot date unavailable"
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function shortVenue(value: string): string {
  return value.split(",")[0]?.trim() || value;
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").trim();
}

function selectedProject(): FestivalProject | undefined {
  return projectById.get(selectedProjectId);
}

function projectCalendarEvents(projectId: string): FestivalEvent[] {
  return calendarEventsByProject.get(projectId) ?? [];
}

function festivalInputValue(value: string): string {
  return value.slice(0, 16);
}

function calendarSlotLabel(event: FestivalEvent): string {
  return `${formatDay(event.start)}, ${formatTime(event.start)}–${formatTime(event.end)}`;
}

function applyCalendarEvent(event: FestivalEvent): void {
  startInput.value = festivalInputValue(event.start);
  endInput.value = festivalInputValue(event.end);
  if (
    !Array.from(arrivalSelect.options).some(
      (option) => option.value === String(event.arrival_minutes),
    )
  ) {
    arrivalSelect.add(
      new Option(`${event.arrival_minutes} minutes`, String(event.arrival_minutes)),
    );
  }
  arrivalSelect.value = String(event.arrival_minutes);
  endInput.removeAttribute("aria-invalid");
  formMessage.textContent = `Official slot selected: ${calendarSlotLabel(event)}.`;
}

function updateCalendarSlotPicker(project: FestivalProject): void {
  const slots = projectCalendarEvents(project.id);
  if (slots.length === 0) {
    calendarSlotSelect.innerHTML = `<option value="manual">Enter the program time manually</option>`;
    calendarSlotSelect.disabled = true;
    calendarSlotHint.textContent = "No trustworthy calendar slot is available for this project.";
    return;
  }
  calendarSlotSelect.innerHTML = [
    ...slots.map(
      (event) =>
        `<option value="${escapeHtml(event.id)}">${escapeHtml(calendarSlotLabel(event))}</option>`,
    ),
    `<option value="manual">Enter a different time manually</option>`,
  ].join("");
  calendarSlotSelect.disabled = false;
  calendarSlotHint.textContent = `${slots.length} official ${slots.length === 1 ? "slot" : "slots"} available in this snapshot.`;
  const firstSlot = slots[0];
  if (firstSlot) applyCalendarEvent(firstSlot);
}

function resetCalendarSlotPicker(): void {
  calendarSlotSelect.innerHTML = `<option value="manual">Choose a project to see official slots</option>`;
  calendarSlotSelect.disabled = true;
  calendarSlotHint.textContent = "You can always enter a time manually below.";
}

function projectMatches(query: string): FestivalProject[] {
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return projects.slice(0, 10);
  return projects
    .flatMap((project) => {
      const title = normalized(project.title);
      const venue = normalized(project.venue);
      const category = normalized(project.category);
      if (!terms.every((term) => title.includes(term) || venue.includes(term) || category.includes(term))) {
        return [];
      }
      const score = terms.reduce((total, term) => {
        if (title === term) return total + 1_000;
        if (title.startsWith(term)) return total + 500;
        if (title.includes(term)) return total + 300;
        if (venue.includes(term)) return total + 100;
        return total + 50;
      }, 0);
      return [{ project, score }];
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.project.title.localeCompare(second.project.title),
    )
    .slice(0, 10)
    .map(({ project }) => project);
}

function renderProjectResults(): void {
  visibleProjects = projectMatches(projectInput.value);
  activeProjectIndex = visibleProjects.length > 0 ? 0 : -1;
  projectResults.innerHTML =
    visibleProjects.length > 0
      ? visibleProjects
          .map(
            (project, index) => `
              <button
                id="project-result-${index}"
                type="button"
                role="option"
                aria-selected="${index === activeProjectIndex}"
                data-project-id="${escapeHtml(project.id)}"
              >
                <strong>${escapeHtml(project.title)}</strong>
                <span>${escapeHtml(project.category)} // ${escapeHtml(shortVenue(project.venue))}</span>
              </button>`,
          )
          .join("")
      : `<p class="no-project-results">No matching public projects.</p>`;
  projectResults.hidden = false;
  projectInput.setAttribute("aria-expanded", "true");
  updateActiveProject();
}

function closeProjectResults(): void {
  projectResults.hidden = true;
  projectInput.setAttribute("aria-expanded", "false");
  projectInput.setAttribute("aria-activedescendant", "");
  activeProjectIndex = -1;
}

function updateActiveProject(): void {
  projectResults
    .querySelectorAll<HTMLElement>('[role="option"]')
    .forEach((option, index) => option.setAttribute("aria-selected", String(index === activeProjectIndex)));
  const active = projectResults.querySelector<HTMLElement>(
    `#project-result-${activeProjectIndex}`,
  );
  projectInput.setAttribute("aria-activedescendant", active?.id ?? "");
  active?.scrollIntoView({ block: "nearest" });
}

function chooseProject(project: FestivalProject): void {
  selectedProjectId = project.id;
  projectInput.value = project.title;
  projectInput.removeAttribute("aria-invalid");
  projectHint.textContent = `${project.category} // ${project.venue}`;
  formMessage.textContent = "";
  updateCalendarSlotPicker(project);
  closeProjectResults();
}

function loadPlan(): PlannedEvent[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PlannedEvent =>
        typeof item === "object" &&
        item !== null &&
        typeof item.key === "string" &&
        typeof item.projectId === "string" &&
        projectById.has(item.projectId) &&
        typeof item.start === "string" &&
        typeof item.end === "string" &&
        typeof item.arrivalMinutes === "number",
    );
  } catch {
    return [];
  }
}

function savePlan(): void {
  localStorage.setItem(storageKey, JSON.stringify(state.plan));
}

function parseLocal(value: string): Date {
  const [datePart = "", timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseLocal(value));
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parseLocal(value));
}

function minutesBetween(first: string, second: string): number {
  return Math.round((parseLocal(second).valueOf() - parseLocal(first).valueOf()) / 60_000);
}

function subtractMinutes(value: string, minutes: number): string {
  const date = new Date(parseLocal(value).valueOf() - minutes * 60_000);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function distance(
  first: Pick<FestivalProject | ServicePlace, "lat" | "lon">,
  second: Pick<FestivalProject | ServicePlace, "lat" | "lon">,
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

function nearestService(
  from: FestivalProject,
  to: FestivalProject,
): { place: ServicePlace | null; detourMinutes: number } {
  const direct = distance(from, to);
  const candidates = state.services
    .filter((place) => state.serviceKinds.has(place.kind))
    .map((place) => {
      const detour = Math.max(0, distance(from, place) + distance(place, to) - direct);
      return { place, detour, detourMinutes: Math.ceil((detour * 1.25) / 75) };
    })
    .filter((candidate) => candidate.detour <= 650)
    .sort((first, second) => first.detour - second.detour);
  return candidates[0] ?? { place: null, detourMinutes: 0 };
}

function sortedPlan(): PlannedEvent[] {
  return [...state.plan].sort(
    (first, second) => parseLocal(first.start).valueOf() - parseLocal(second.start).valueOf(),
  );
}

function transfers(plan: PlannedEvent[]): Transfer[] {
  return plan.slice(0, -1).flatMap((from, index) => {
    const to = plan[index + 1];
    if (!to) return [];
    const fromProject = projectById.get(from.projectId);
    const toProject = projectById.get(to.projectId);
    if (!fromProject || !toProject) return [];
    const meters = distance(fromProject, toProject);
    const walk = walkingMinutes(meters);
    const service = nearestService(fromProject, toProject);
    const available = minutesBetween(from.end, to.start);
    return [
      {
        from,
        to,
        distance: meters,
        walkMinutes: walk,
        availableMinutes: available,
        departure: subtractMinutes(to.start, walk + to.arrivalMinutes),
        slackMinutes: available - walk - to.arrivalMinutes,
        service: service.place,
        serviceDetourMinutes: service.detourMinutes,
      },
    ];
  });
}

function efaUrl(transfer: Transfer): string {
  const from = projectById.get(transfer.from.projectId);
  const to = projectById.get(transfer.to.projectId);
  if (!from || !to) return "#";
  const departure = parseLocal(transfer.from.end);
  const date = [
    departure.getFullYear(),
    String(departure.getMonth() + 1).padStart(2, "0"),
    String(departure.getDate()).padStart(2, "0"),
  ].join("");
  const time = `${String(departure.getHours()).padStart(2, "0")}${String(departure.getMinutes()).padStart(2, "0")}`;
  const params = new URLSearchParams({
    locationServerActive: "1",
    stateless: "1",
    outputFormat: "JSON",
    type_origin: "coord",
    name_origin: `${from.lon}:${from.lat}:WGS84[dd.ddddd]`,
    type_destination: "coord",
    name_destination: `${to.lon}:${to.lat}:WGS84[dd.ddddd]`,
    itdDate: date,
    itdTime: time,
    itdTripDateTimeDepArr: "dep",
    useRealtime: "1",
    "coordOutputFormat": "WGS84[DD.ddddd]",
  });
  return `https://www.linzag.at/static/XML_TRIP_REQUEST2?${params.toString()}`;
}

function statusFor(transfer: Transfer): { label: string; className: string; text: string } {
  if (transfer.availableMinutes < 0) {
    return {
      label: "Overlap",
      className: "danger",
      text: `Events overlap by ${Math.abs(transfer.availableMinutes)} min.`,
    };
  }
  if (transfer.slackMinutes < 0) {
    return {
      label: "Too tight",
      className: "danger",
      text: `At least ${Math.abs(transfer.slackMinutes)} more min needed.`,
    };
  }
  if (transfer.slackMinutes < 10) {
    return {
      label: "Close",
      className: "warning",
      text: `${transfer.slackMinutes} min remain after walking and arrival buffer.`,
    };
  }
  return {
    label: "Feasible",
    className: "good",
    text: `${transfer.slackMinutes} min remain after walking and arrival buffer.`,
  };
}

function eventMarkup(item: PlannedEvent, index: number): string {
  const project = projectById.get(item.projectId);
  if (!project) return "";
  return `
    <article class="timeline-event">
      <div class="timeline-time">
        <span>${escapeHtml(formatDay(item.start))}</span>
        <strong>${formatTime(item.start)}</strong>
        <small>until ${formatTime(item.end)}</small>
      </div>
      <div class="timeline-node" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></div>
      <div class="timeline-content">
        <p>${escapeHtml(project.category)}</p>
        <h4>${escapeHtml(project.title)}</h4>
        <span>${escapeHtml(project.venue)}</span>
        <small>Plan to arrive ${item.arrivalMinutes} min early</small>
      </div>
      <button class="remove-event" type="button" data-remove="${escapeHtml(item.key)}" aria-label="Remove ${escapeHtml(project.title)}">Remove</button>
    </article>
  `;
}

function transferMarkup(transfer: Transfer): string {
  const to = projectById.get(transfer.to.projectId);
  if (!to) return "";
  const status = statusFor(transfer);
  const distanceLabel =
    transfer.distance < 1_000
      ? `${Math.round(transfer.distance / 10) * 10} m`
      : `${(transfer.distance / 1_000).toFixed(1)} km`;
  const serviceMarkup = transfer.service
    ? `
      <div class="service-suggestion">
        <span class="service-symbol service-symbol--${transfer.service.kind}" aria-hidden="true">${transfer.service.kind === "water" ? "●" : "■"}</span>
        <div>
          <strong>${transfer.service.kind === "water" ? "Water stop" : "Public toilet"} // ${escapeHtml(transfer.service.name)}</strong>
          <p>${escapeHtml(transfer.service.detail || "City open-data location")} · about ${transfer.serviceDetourMinutes} extra min</p>
        </div>
      </div>`
    : "";
  return `
    <article class="transfer">
      <div class="transfer-rule" aria-hidden="true"></div>
      <div class="transfer-body">
        <div class="transfer-summary">
          <div>
            <p class="transfer-label">TRANSFER // ${escapeHtml(shortVenue(to.venue))}</p>
            <h4>Leave by <strong>${transfer.departure}</strong></h4>
          </div>
          <span class="status status--${status.className}">${status.label}</span>
        </div>
        <p class="transfer-facts">
          <strong>${transfer.walkMinutes} min walk</strong>
          <span>${distanceLabel} estimated</span>
          <span>${transfer.availableMinutes} min between events</span>
        </p>
        <p class="status-copy">${status.text}</p>
        ${serviceMarkup}
        <a class="transit-link" href="${escapeHtml(efaUrl(transfer))}" target="_blank" rel="noreferrer">
          Open this trip in LINZ AG EFA <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  `;
}

function renderTimeline(): void {
  const plan = sortedPlan();
  clearPlan.disabled = plan.length === 0;
  if (plan.length === 0) {
    timeline.innerHTML = `
      <div class="empty-plan">
        <span aria-hidden="true">↘</span>
        <h4>Your day starts here.</h4>
        <p>Add two or more events to see transfers, departure times, and useful stops.</p>
      </div>`;
    renderMap(plan, []);
    return;
  }
  const transferList = transfers(plan);
  timeline.innerHTML = plan
    .map((item, index) => {
      const transfer = transferList[index];
      return eventMarkup(item, index) + (transfer ? transferMarkup(transfer) : "");
    })
    .join("");
  renderMap(plan, transferList);
}

function renderMap(plan: PlannedEvent[], transferList: Transfer[]): void {
  const points = plan.flatMap((item, index) => {
    const project = projectById.get(item.projectId);
    return project ? [{ ...project, mapKey: item.key, index }] : [];
  });
  const servicePoints = transferList.flatMap((transfer) =>
    transfer.service ? [transfer.service] : [],
  );
  if (points.length === 0) {
    routeMap.innerHTML = `
      <div class="map-empty">
        <span aria-hidden="true">01—02—03</span>
        <p>Your venue weave will appear here.</p>
      </div>`;
    return;
  }
  const all = [...points, ...servicePoints];
  const minLat = Math.min(...all.map((point) => point.lat));
  const maxLat = Math.max(...all.map((point) => point.lat));
  const minLon = Math.min(...all.map((point) => point.lon));
  const maxLon = Math.max(...all.map((point) => point.lon));
  const latRange = Math.max(maxLat - minLat, 0.004);
  const lonRange = Math.max(maxLon - minLon, 0.006);
  const plot = (lat: number, lon: number) => ({
    x: 70 + ((lon - minLon) / lonRange) * 660,
    y: 60 + ((maxLat - lat) / latRange) * 390,
  });
  const path = points
    .map((point, index) => {
      const position = plot(point.lat, point.lon);
      return `${index === 0 ? "M" : "L"} ${position.x.toFixed(1)} ${position.y.toFixed(1)}`;
    })
    .join(" ");
  routeMap.innerHTML = `
    <svg viewBox="0 0 800 510" role="img" aria-labelledby="map-title map-description">
      <title id="map-title">Geographic overview of selected festival venues</title>
      <desc id="map-description">${points.length} selected events connected chronologically. North is at the top.</desc>
      <g class="map-grid" aria-hidden="true">
        ${[1, 2, 3, 4].map((index) => `<line x1="0" y1="${index * 102}" x2="800" y2="${index * 102}"/>`).join("")}
        ${[1, 2, 3, 4, 5, 6, 7].map((index) => `<line x1="${index * 100}" y1="0" x2="${index * 100}" y2="510"/>`).join("")}
      </g>
      ${points.length > 1 ? `<path class="map-path" d="${path}"/>` : ""}
      ${servicePoints
        .map((place) => {
          const position = plot(place.lat, place.lon);
          return `<g class="map-service map-service--${place.kind}" transform="translate(${position.x} ${position.y})">
            <title>${escapeHtml(place.name)}</title>
            <rect x="-12" y="-12" width="24" height="24"/>
            <text y="4">${place.kind === "water" ? "●" : "■"}</text>
          </g>`;
        })
        .join("")}
      ${points
        .map((point) => {
          const position = plot(point.lat, point.lon);
          return `<g class="map-venue" transform="translate(${position.x} ${position.y})">
            <circle r="25"/>
            <text y="6">${point.index + 1}</text>
            <title>${escapeHtml(point.title)} — ${escapeHtml(point.venue)}</title>
          </g>`;
        })
        .join("")}
      <text class="north" x="748" y="38">N ↑</text>
    </svg>`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const project = selectedProject();
  if (!project) {
    formMessage.textContent = "Choose an exact title from the project suggestions.";
    projectInput.setAttribute("aria-invalid", "true");
    projectInput.focus();
    return;
  }
  if (parseLocal(endInput.value) <= parseLocal(startInput.value)) {
    formMessage.textContent = "The event must end after it starts.";
    endInput.setAttribute("aria-invalid", "true");
    endInput.focus();
    return;
  }
  projectInput.removeAttribute("aria-invalid");
  endInput.removeAttribute("aria-invalid");
  state.plan.push({
    key: crypto.randomUUID(),
    projectId: project.id,
    start: startInput.value,
    end: endInput.value,
    arrivalMinutes: Number(arrivalSelect.value),
  });
  savePlan();
  formMessage.textContent = `${project.title} added.`;
  selectedProjectId = "";
  projectInput.value = "";
  resetCalendarSlotPicker();
  const nextStart = new Date(parseLocal(endInput.value).valueOf() + 90 * 60_000);
  const nextEnd = new Date(nextStart.valueOf() + 60 * 60_000);
  startInput.value = localInputValue(nextStart);
  endInput.value = localInputValue(nextEnd);
  renderTimeline();
  projectInput.focus();
});

function localInputValue(date: Date): string {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const timePart = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");
  return `${datePart}T${timePart}`;
}

projectInput.addEventListener("input", () => {
  selectedProjectId = "";
  projectHint.textContent = "Choose a title from the public festival dataset.";
  resetCalendarSlotPicker();
  projectInput.removeAttribute("aria-invalid");
  formMessage.textContent = "";
  renderProjectResults();
});

calendarSlotSelect.addEventListener("change", () => {
  const event = calendarEventById.get(calendarSlotSelect.value);
  if (event) {
    applyCalendarEvent(event);
    return;
  }
  calendarSlotHint.textContent = "Using a manually entered time for this project.";
  formMessage.textContent = "Enter the time shown in the official program.";
  startInput.focus();
});

for (const input of [startInput, endInput]) {
  input.addEventListener("input", () => {
    if (calendarEventById.has(calendarSlotSelect.value)) {
      calendarSlotSelect.value = "manual";
      calendarSlotHint.textContent = "Program time changed manually.";
      formMessage.textContent = "Using a manually adjusted time for this project.";
    }
  });
}

projectInput.addEventListener("focus", () => {
  renderProjectResults();
});

projectInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (projectResults.hidden) renderProjectResults();
    if (visibleProjects.length === 0) return;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeProjectIndex =
      (activeProjectIndex + direction + visibleProjects.length) % visibleProjects.length;
    updateActiveProject();
    return;
  }
  if (event.key === "Enter" && !projectResults.hidden && activeProjectIndex >= 0) {
    event.preventDefault();
    const project = visibleProjects[activeProjectIndex];
    if (project) chooseProject(project);
    return;
  }
  if (event.key === "Escape") {
    closeProjectResults();
  }
});

projectResults.addEventListener("mousedown", (event) => {
  event.preventDefault();
});

projectResults.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const option = target.closest<HTMLElement>("[data-project-id]");
  const project = option?.dataset.projectId
    ? projectById.get(option.dataset.projectId)
    : undefined;
  if (project) {
    chooseProject(project);
    projectInput.focus();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!element?.closest(".project-picker")) {
    closeProjectResults();
  }
});

timeline.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>("[data-remove]");
  const key = button?.dataset.remove;
  if (!key) return;
  state.plan = state.plan.filter((item) => item.key !== key);
  savePlan();
  renderTimeline();
});

clearPlan.addEventListener("click", () => {
  state.plan = [];
  savePlan();
  renderTimeline();
  formMessage.textContent = "Your draft has been cleared.";
});

document.querySelectorAll<HTMLInputElement>(".service-controls input").forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) state.serviceKinds.add(input.value as ServiceKind);
    else state.serviceKinds.delete(input.value as ServiceKind);
    renderTimeline();
  });
});

renderTimeline();
try {
  state.services = await loadServices();
  renderTimeline();
} catch (error) {
  console.warn(error);
  routeMap.insertAdjacentHTML(
    "afterend",
    `<p class="data-error">City service data could not be loaded; the event route still works.</p>`,
  );
}
