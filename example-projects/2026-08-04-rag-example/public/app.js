const form = document.querySelector("#search");
const questionInput = document.querySelector("#question");
const results = document.querySelector("#results");
const answerElement = document.querySelector("#answer");
const sourcesElement = document.querySelector("#sources");
const sourceCount = document.querySelector("#source-count");
const resultQuery = document.querySelector("#result-query");
const submitButton = form.querySelector("button[type='submit']");

function renderAnswer(answer, sourceTotal) {
  answerElement.replaceChildren();
  const fragments = answer.split(/(\[\d+\])/g);
  for (const fragment of fragments) {
    const match = /^\[(\d+)\]$/.exec(fragment);
    const number = match ? Number(match[1]) : 0;
    if (number > 0 && number <= sourceTotal) {
      const link = document.createElement("a");
      link.href = `#source-${number}`;
      link.textContent = fragment;
      link.setAttribute("aria-label", `Go to source ${number}`);
      answerElement.append(link);
    } else {
      answerElement.append(document.createTextNode(fragment));
    }
  }
}

function addMetadata(container, source) {
  const metadata = [source.category, source.location, source.language.toUpperCase()].filter(Boolean);
  for (const item of metadata) {
    const span = document.createElement("span");
    span.textContent = item;
    container.append(span);
  }
}

function renderSources(sources) {
  sourcesElement.replaceChildren();
  sourceCount.textContent = `${sources.length} ${sources.length === 1 ? "project" : "projects"}`;
  if (sources.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-source";
    empty.textContent = "No sufficiently similar public projects were found.";
    sourcesElement.append(empty);
    return;
  }
  for (const source of sources) {
    const item = document.createElement("li");
    item.id = `source-${source.number}`;

    const number = document.createElement("span");
    number.className = "source-number";
    number.textContent = String(source.number).padStart(2, "0");

    const content = document.createElement("div");
    const title = source.url ? document.createElement("a") : document.createElement("span");
    title.className = "source-title";
    title.textContent = source.title;
    if (source.url) {
      title.href = source.url;
      title.target = "_blank";
      title.rel = "noreferrer";
    }
    const metadata = document.createElement("div");
    metadata.className = "source-meta";
    addMetadata(metadata, source);
    content.append(title, metadata);

    const score = document.createElement("span");
    score.className = "source-score";
    score.textContent = source.score.toFixed(3);
    score.title = "Cosine similarity score";
    item.append(number, content, score);
    sourcesElement.append(item);
  }
}

function showError(message) {
  renderAnswer(message, 0);
  renderSources([]);
}

async function ask(question) {
  results.hidden = false;
  results.setAttribute("aria-busy", "true");
  resultQuery.textContent = `“${question}”`;
  answerElement.textContent = "Searching public festival projects…";
  sourcesElement.replaceChildren();
  sourceCount.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Searching…";

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The search could not be completed.");
    renderAnswer(data.answer, data.sources.length);
    renderSources(data.sources);
  } catch (error) {
    showError(error instanceof Error ? error.message : "The search could not be completed.");
  } finally {
    results.setAttribute("aria-busy", "false");
    submitButton.disabled = false;
    submitButton.textContent = "Ask ↗";
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (question) void ask(question);
});

for (const example of document.querySelectorAll("[data-question]")) {
  example.addEventListener("click", () => {
    questionInput.value = example.dataset.question;
    questionInput.focus();
  });
}
