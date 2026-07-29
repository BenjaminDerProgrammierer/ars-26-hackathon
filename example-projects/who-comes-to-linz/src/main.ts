import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "./style.css";
import snapshot from "./country-data.json";

type TourismQuarter = {
  quarter: number;
  arrivals: number;
  nights: number;
};

type Contact = {
  name: string;
  category: string;
  url: string;
};

type Country = {
  code: string;
  name: string;
  tourism: TourismQuarter[];
  contacts: Contact[];
  projects: string[];
};

type Metrics = {
  arrivals: number;
  nights: number;
};

type Scope = "represented" | "all";
type Sort = "contacts" | "arrivals" | "nights";

const countries = snapshot.countries as Country[];
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const number = new Intl.NumberFormat("en-GB");
const compactNumber = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const state: {
  quarter: number;
  scope: Scope;
  sort: Sort;
  query: string;
  selectedCode: string;
} = {
  quarter: 0,
  scope: "represented",
  sort: "contacts",
  query: "",
  selectedCode: "AT",
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

const representedCountries = countries.filter((country) => country.contacts.length > 0);
const overlapCountries = representedCountries.filter((country) => country.tourism.length > 0);
const totalArrivals = countries.reduce(
  (sum, country) => sum + metrics(country, 0).arrivals,
  0,
);

app.innerHTML = `
  <header class="institutional-header">
    <a class="wordmark" href="../" aria-label="Back to example projects">ARS ELECTRONICA</a>
    <span>FESTIVAL 2026 // LINZ</span>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">ONE CITY // MANY ORIGINS</p>
      <h1>WHO<br>COMES TO<br><strong>LINZ?</strong></h1>
      <div class="hero-intro">
        <p>
          A festival introduces people and ideas from around the world. A city’s guest
          statistics tell another story. Where do these two pictures meet?
        </p>
        <a href="#comparison">See the comparison ↓</a>
      </div>
      <dl class="hero-facts" aria-label="Dataset overview">
        <div><dt>${snapshot.public_contact_count}</dt><dd>published festival contacts</dd></div>
        <div><dt>${representedCountries.length}</dt><dd>countries represented</dd></div>
        <div><dt>${overlapCountries.length}</dt><dd>shared with guest statistics</dd></div>
        <div><dt>${compactNumber.format(totalArrivals)}</dt><dd>country-coded arrivals in 2024</dd></div>
      </dl>
    </section>

    <section class="comparison" id="comparison" aria-labelledby="comparison-title">
      <div class="section-heading">
        <p class="eyebrow">TWO WAYS INTO LINZ</p>
        <h2 id="comparison-title">Compare the<br>country stories.</h2>
        <p>
          Higher dots mean more published festival contacts. Further right means more
          recorded accommodation arrivals. Select a dot or table row to inspect it.
        </p>
      </div>

      <div class="controls" aria-label="Comparison controls">
        <fieldset class="quarter-control">
          <legend>Tourism period</legend>
          <div>
            ${[
              ["Full year", 0],
              ["Q1", 1],
              ["Q2", 2],
              ["Q3", 3],
              ["Q4", 4],
            ]
              .map(
                ([label, value]) =>
                  `<button type="button" data-quarter="${value}" aria-pressed="${value === 0}">${label}</button>`,
              )
              .join("")}
          </div>
        </fieldset>
        <label>
          <span>Countries shown</span>
          <select id="scope">
            <option value="represented">Festival represented</option>
            <option value="all">All guest origins</option>
          </select>
        </label>
      </div>

      <div class="visual-grid">
        <div class="plot-panel">
          <div class="plot-key" aria-hidden="true">
            <span><i class="dot dot--festival"></i> Festival represented</span>
            <span><i class="dot dot--tourism"></i> Guest statistics only</span>
          </div>
          <div class="plot-scroll">
            <svg
              id="plot"
              viewBox="0 0 1000 570"
              role="img"
              aria-labelledby="plot-title plot-description"
            >
              <title id="plot-title">Festival contacts compared with Linz guest arrivals by country</title>
              <desc id="plot-description">An interactive scatter plot. Use the country table below for the same values in text form.</desc>
            </svg>
          </div>
          <p class="plot-note">
            Horizontal spacing uses a logarithmic scale so smaller countries remain visible.
            Dot size reflects overnight stays; small vertical offsets keep equal values selectable.
          </p>
        </div>
        <aside class="country-detail" id="country-detail" aria-live="polite"></aside>
      </div>
    </section>

    <section class="country-table-section" aria-labelledby="country-table-title">
      <div class="table-heading">
        <div>
          <p class="eyebrow">READ THE NUMBERS</p>
          <h2 id="country-table-title">Country by country.</h2>
        </div>
        <div class="table-tools">
          <label>
            <span>Find a country</span>
            <input id="country-search" type="search" placeholder="Search name or code">
          </label>
          <label>
            <span>Rank by</span>
            <select id="sort">
              <option value="contacts">Festival contacts</option>
              <option value="arrivals">Guest arrivals</option>
              <option value="nights">Overnight stays</option>
            </select>
          </label>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Country</th>
              <th scope="col">Festival contacts</th>
              <th scope="col">Linked projects</th>
              <th scope="col">Guest arrivals</th>
              <th scope="col">Overnight stays</th>
              <th scope="col">Average stay</th>
            </tr>
          </thead>
          <tbody id="country-rows"></tbody>
        </table>
      </div>
      <p class="empty-state" id="empty-state" hidden>No countries match this search.</p>
    </section>

    <section class="method">
      <p class="eyebrow">COMPARE WITHOUT CONFUSING</p>
      <div>
        <h2>Two snapshots.<br>Not one crowd.</h2>
        <p>
          Festival contacts are published people and organizations—not all artists,
          visitors, or ticket holders. Tourism arrivals count accommodation check-ins
          during 2024—not unique people, residents, day visitors, or festival attendance.
          An overlap is a prompt for curiosity, not evidence that one dataset caused the other.
        </p>
      </div>
    </section>
  </main>

  <footer>
    <strong>WHO COMES TO LINZ?</strong>
    <p>
      Festival export: ${formatDate(snapshot.festival_generated_at)} ·
      Guest statistics: ${snapshot.tourism_year}
    </p>
    <span>Data: Ars Electronica & Stadt Linz (CC BY 4.0)</span>
  </footer>
`;

const plot = requiredElement<SVGSVGElement>("#plot");
const detail = requiredElement<HTMLElement>("#country-detail");
const rows = requiredElement<HTMLTableSectionElement>("#country-rows");
const scopeSelect = requiredElement<HTMLSelectElement>("#scope");
const sortSelect = requiredElement<HTMLSelectElement>("#sort");
const searchInput = requiredElement<HTMLInputElement>("#country-search");
const emptyState = requiredElement<HTMLParagraphElement>("#empty-state");

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required interface element not found: ${selector}`);
  return element;
}

function countryName(country: Country): string {
  try {
    return displayNames.of(country.code) || country.name;
  } catch {
    return country.name;
  }
}

function metrics(country: Country, quarter: number): Metrics {
  const selected = quarter
    ? country.tourism.filter((row) => row.quarter === quarter)
    : country.tourism;
  return selected.reduce(
    (totals, row) => ({
      arrivals: totals.arrivals + row.arrivals,
      nights: totals.nights + row.nights,
    }),
    { arrivals: 0, nights: 0 },
  );
}

function formatDate(value: string | null): string {
  if (!value) return "date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "date unavailable"
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function filteredCountries(): Country[] {
  const query = state.query.toLocaleLowerCase().trim();
  return countries
    .filter((country) => state.scope === "all" || country.contacts.length > 0)
    .filter(
      (country) =>
        !query ||
        country.code.toLocaleLowerCase().includes(query) ||
        countryName(country).toLocaleLowerCase().includes(query),
    );
}

function sortedCountries(): Country[] {
  return filteredCountries().sort((first, second) => {
    const firstMetrics = metrics(first, state.quarter);
    const secondMetrics = metrics(second, state.quarter);
    const score =
      state.sort === "contacts"
        ? second.contacts.length - first.contacts.length
        : state.sort === "arrivals"
          ? secondMetrics.arrivals - firstMetrics.arrivals
          : secondMetrics.nights - firstMetrics.nights;
    return score || countryName(first).localeCompare(countryName(second));
  });
}

function axisLabel(value: number): string {
  return value === 0 ? "not separately listed" : compactNumber.format(value);
}

function plotX(arrivals: number, maxArrivals: number): number {
  const start = 92;
  const end = 930;
  return start + (Math.log10(arrivals + 1) / Math.log10(maxArrivals + 1)) * (end - start);
}

function plotY(country: Country, index: number): number {
  if (country.contacts.length === 0) return 490 + (index % 3) * 9;
  const valuePosition = 476 - (country.contacts.length / 10) * 388;
  const collisionOffset =
    country.contacts.length <= 2 ? ((index * 7) % 5 - 2) * 6 : 0;
  return valuePosition + collisionOffset;
}

function renderPlot(): void {
  const shown = filteredCountries();
  const maxArrivals = Math.max(1, ...shown.map((country) => metrics(country, state.quarter).arrivals));
  const xTicks = [0, 10, 100, 1_000, 10_000, 100_000].filter(
    (tick) => tick === 0 || tick <= maxArrivals,
  );
  const yTicks = [0, 1, 2, 5, 10];

  plot.innerHTML = `
    <title id="plot-title">Festival contacts compared with Linz guest arrivals by country</title>
    <desc id="plot-description">${shown.length} countries are shown for ${state.quarter ? `quarter ${state.quarter}` : "the full year"}.</desc>
    <g class="grid-lines" aria-hidden="true">
      ${xTicks
        .map((tick) => {
          const x = plotX(tick, maxArrivals);
          return `<line x1="${x}" y1="62" x2="${x}" y2="518"></line><text x="${x}" y="548">${axisLabel(tick)}</text>`;
        })
        .join("")}
      ${yTicks
        .map((tick) => {
          const y = tick === 0 ? 490 : 476 - (tick / 10) * 388;
          return `<line x1="72" y1="${y}" x2="950" y2="${y}"></line><text x="56" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
    </g>
    <text class="axis-title axis-title--x" x="510" y="568">RECORDED GUEST ARRIVALS →</text>
    <text class="axis-title axis-title--y" transform="translate(17 310) rotate(-90)">PUBLISHED FESTIVAL CONTACTS →</text>
    <g class="country-marks">
      ${shown
        .map((country, index) => {
          const countryMetrics = metrics(country, state.quarter);
          const x =
            countryMetrics.arrivals === 0
              ? 92 + (index % 4) * 10
              : plotX(countryMetrics.arrivals, maxArrivals);
          const y = plotY(country, index);
          const radius = Math.min(
            24,
            7 + Math.log10(Math.max(1, countryMetrics.nights)) * 2.4,
          );
          const represented = country.contacts.length > 0;
          const selected = country.code === state.selectedCode;
          const showLabel = selected || country.contacts.length > 1;
          const labelAnchor = x > 790 ? "end" : "start";
          const labelX = x > 790 ? x - radius - 6 : x + radius + 6;
          return `
            <g class="country-mark ${represented ? "country-mark--festival" : "country-mark--tourism"} ${selected ? "is-selected" : ""}">
              <g class="hit-target" role="button" tabindex="0" data-code="${country.code}" aria-label="${escapeHtml(countryName(country))}: ${country.contacts.length} festival contacts, ${number.format(countryMetrics.arrivals)} guest arrivals">
                <title>${escapeHtml(countryName(country))}: ${country.contacts.length} contacts · ${number.format(countryMetrics.arrivals)} arrivals</title>
                <circle cx="${x}" cy="${y}" r="${radius}"></circle>
              </g>
              ${
                represented && showLabel
                  ? `<text x="${labelX}" y="${y + 4}" text-anchor="${labelAnchor}">${escapeHtml(country.code)}</text>`
                  : ""
              }
            </g>`;
        })
        .join("")}
    </g>
  `;

  plot.querySelectorAll<SVGGElement>(".hit-target").forEach((target) => {
    target.addEventListener("click", () => selectCountry(target.dataset.code || ""));
    target.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectCountry(target.dataset.code || "");
    });
  });
}

function renderDetail(): void {
  const country =
    countries.find((candidate) => candidate.code === state.selectedCode) ??
    filteredCountries()[0];
  if (!country) {
    detail.innerHTML = "<p>Select a country to inspect its data.</p>";
    return;
  }
  state.selectedCode = country.code;
  const current = metrics(country, state.quarter);
  const stay = current.arrivals ? current.nights / current.arrivals : 0;
  const tourismPeriod = state.quarter ? `Q${state.quarter} 2024` : "2024";

  detail.innerHTML = `
    <p class="detail-code">${escapeHtml(country.code)} // SELECTED COUNTRY</p>
    <h3>${escapeHtml(countryName(country))}</h3>
    <dl class="detail-stats">
      <div><dt>${country.contacts.length}</dt><dd>festival contacts</dd></div>
      <div><dt>${country.projects.length}</dt><dd>linked public projects</dd></div>
      <div><dt>${current.arrivals ? number.format(current.arrivals) : "—"}</dt><dd>guest arrivals · ${tourismPeriod}</dd></div>
      <div><dt>${stay ? `${stay.toFixed(1)} nights` : "—"}</dt><dd>average recorded stay</dd></div>
    </dl>
    ${
      country.contacts.length
        ? `<div class="detail-list">
            <h4>Published contacts</h4>
            <ul>
              ${country.contacts
                .map(
                  (contact) => `
                    <li>
                      ${
                        contact.url
                          ? `<a href="${escapeHtml(contact.url)}" target="_blank" rel="noreferrer">${escapeHtml(contact.name)} ↗</a>`
                          : `<span>${escapeHtml(contact.name)}</span>`
                      }
                      <small>${escapeHtml(contact.category)}</small>
                    </li>`,
                )
                .join("")}
            </ul>
          </div>`
        : `<p class="detail-absence">No published festival contact from this country appears in the current export.</p>`
    }
    ${
      country.tourism.length
        ? ""
        : `<p class="detail-absence">This country is not separately listed in the Linz guest-origin table.</p>`
    }
  `;
}

function renderTable(): void {
  const ordered = sortedCountries();
  emptyState.hidden = ordered.length > 0;
  rows.innerHTML = ordered
    .map((country) => {
      const current = metrics(country, state.quarter);
      const stay = current.arrivals ? `${(current.nights / current.arrivals).toFixed(1)} nights` : "—";
      return `
        <tr class="${country.code === state.selectedCode ? "is-selected" : ""}" data-code="${country.code}">
          <th scope="row">
            <button type="button">
              <span>${escapeHtml(countryName(country))}</span>
              <small>${escapeHtml(country.code)}</small>
            </button>
          </th>
          <td>${country.contacts.length || "—"}</td>
          <td>${country.projects.length || "—"}</td>
          <td>${current.arrivals ? number.format(current.arrivals) : "—"}</td>
          <td>${current.nights ? number.format(current.nights) : "—"}</td>
          <td>${stay}</td>
        </tr>`;
    })
    .join("");

  rows.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
    row.querySelector("button")?.addEventListener("click", () => {
      selectCountry(row.dataset.code || "");
      document.querySelector("#comparison")?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function selectCountry(code: string): void {
  if (!countries.some((country) => country.code === code)) return;
  state.selectedCode = code;
  render();
}

function render(): void {
  renderPlot();
  renderDetail();
  renderTable();
}

document.querySelectorAll<HTMLButtonElement>("[data-quarter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.quarter = Number(button.dataset.quarter);
    document.querySelectorAll<HTMLButtonElement>("[data-quarter]").forEach((candidate) => {
      candidate.setAttribute(
        "aria-pressed",
        String(Number(candidate.dataset.quarter) === state.quarter),
      );
    });
    render();
  });
});

scopeSelect.addEventListener("change", () => {
  state.scope = scopeSelect.value as Scope;
  if (
    state.scope === "represented" &&
    !representedCountries.some((country) => country.code === state.selectedCode)
  ) {
    state.selectedCode = representedCountries[0]?.code ?? "";
  }
  render();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value as Sort;
  renderTable();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  renderPlot();
  renderTable();
});

render();
