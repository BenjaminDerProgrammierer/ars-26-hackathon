import "./style.css";

type Event = {
  id: string;
  title: string;
  category: string;
  venue: string;
  start: string;
  end: string;
  url: string | null;
};

type CalendarData = {
  generatedAt: string | null;
  calendarRows: number;
  events: Event[];
};

const app = requiredElement<HTMLElement>("#app");

try {
  const response = await fetch("/events.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as CalendarData;
  render(data);
} catch (error) {
  app.innerHTML = `<p class="status">Kalender konnte nicht geladen werden: ${escapeHtml(String(error))}</p>`;
}

function render(data: CalendarData): void {
  const days = new Map<string, Event[]>();
  for (const event of data.events) {
    const day = event.start.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), event]);
  }
  app.innerHTML = `
    <header>
      <p>ARS ELECTRONICA FESTIVAL 2026</p>
      <h1>Kalender</h1>
      <span>${data.events.length} öffentliche Termine</span>
    </header>
    ${
      data.events.length === 0
        ? `<p class="status">
            Der aktuelle Export enthält ${data.calendarRows} Kalenderzeilen, aber keine davon
            lässt sich sicher mit einem öffentlichen Projekt verknüpfen.
          </p>`
        : `<section class="calendar" aria-label="Festivaltermine">
            ${[...days].map(([day, events]) => dayColumn(day, events)).join("")}
          </section>`
    }
    <footer>Datensatz: Ars Electronica · Stand ${formatGeneratedAt(data.generatedAt)}</footer>
  `;
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Element fehlt: ${selector}`);
  return element;
}

function dayColumn(day: string, events: Event[]): string {
  const date = new Date(`${day}T12:00:00+02:00`);
  return `
    <section class="day">
      <h2>${new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long" }).format(date)}</h2>
      ${events.map(eventCard).join("")}
    </section>
  `;
}

function eventCard(event: Event): string {
  const title = escapeHtml(event.title);
  const content = `
    <time>${formatTime(event.start)}–${formatTime(event.end)}</time>
    <strong>${title}</strong>
    <span>${escapeHtml(event.category)} · ${escapeHtml(event.venue)}</span>
  `;
  return event.url
    ? `<a class="event" href="${escapeHtml(event.url)}" target="_blank" rel="noreferrer">${content}</a>`
    : `<article class="event">${content}</article>`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

function formatGeneratedAt(value: string | null): string {
  if (!value) return "unbekannt";
  return new Intl.DateTimeFormat("de-AT", { dateStyle: "medium" }).format(new Date(value));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
