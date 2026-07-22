const state = {
  keys: [],
  selected: new Set(),
  secrets: [],
  operations: [],
  ownedCreateOperations: new Set(),
  revealedCreateOperations: new Set(),
  availableModelCount: null,
  editingLocked: false,
  activeManager: "openrouter",
  redeemKeys: [],
  redeemSelected: new Set(),
  redeemedSecretIndexes: new Set(),
  environments: [],
  environmentSelected: new Set(),
  environmentOperation: null,
  environmentConfigured: false,
  environmentModel: null,
};
const LOCALE = "de-AT";

let operationsLoading = false;
let operationsPollTimer;
let environmentPollTimer;
let confirmResolver = null;

const $ = (selector) => document.querySelector(selector);

function renderIcons(root = document) {
  window.lucide?.createIcons({
    root,
    attrs: {
      "aria-hidden": "true",
      "stroke-width": 1.75,
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok && response.status !== 207) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.hidden = false;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}

function resolveConfirmation(confirmed) {
  if (!confirmResolver) return;
  const resolve = confirmResolver;
  confirmResolver = null;
  const dialog = $("#confirm-dialog");
  if (dialog.open) dialog.close();
  resolve(confirmed);
}

function requestConfirmation({ title, message, confirmLabel }) {
  if (confirmResolver) resolveConfirmation(false);
  $("#confirm-title").textContent = title;
  $("#confirm-message").textContent = message;
  $("#confirm-action-button .button-label").textContent = confirmLabel;
  $("#confirm-dialog").showModal();
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatExpiry(value) {
  return value ? formatDate(value) : "Never";
}

function filteredKeys() {
  const query = $("#search-input").value.trim().toLocaleLowerCase(LOCALE);
  if (!query) return state.keys;
  return state.keys.filter(
    (key) =>
      key.name.toLocaleLowerCase(LOCALE).includes(query) ||
      key.hash.toLocaleLowerCase(LOCALE).includes(query),
  );
}

function renderMetrics() {
  const active = state.keys.filter((key) => !key.disabled).length;
  const usage = state.keys.reduce((sum, key) => sum + key.usage, 0);
  $("#metric-total").textContent = state.keys.length;
  $("#metric-active").textContent = active;
  $("#metric-usage").textContent = formatMoney(usage);
  $("#metric-models").textContent = state.availableModelCount ?? "—";
}

function renderSelection() {
  const visible = filteredKeys();
  const selectedVisible = visible.filter((key) => state.selected.has(key.hash));
  const selectedKeys = state.keys.filter((key) => state.selected.has(key.hash));
  const hasActiveKeys = selectedKeys.some((key) => !key.disabled);
  const hasDisabledKeys = selectedKeys.some((key) => key.disabled);
  $("#bulk-bar").hidden = state.selected.size === 0;
  $("#bulk-enable-button").hidden = !hasDisabledKeys;
  $("#bulk-disable-button").hidden = !hasActiveKeys;
  $("#selected-count").textContent = state.selected.size;
  $("#select-all").checked = visible.length > 0 && selectedVisible.length === visible.length;
  $("#select-all").indeterminate =
    selectedVisible.length > 0 && selectedVisible.length < visible.length;
}

function renderKeys() {
  const keys = filteredKeys();
  const body = $("#keys-body");
  $("#result-count").textContent = `${keys.length} of ${state.keys.length} keys`;
  $("#empty-state").hidden = keys.length > 0;
  $(".table-wrap").hidden = keys.length === 0;

  body.innerHTML = keys
    .map((key) => {
      const hasLimit = key.limit !== null;
      const percentage =
        hasLimit && key.limit > 0 ? Math.min(100, (key.usage / key.limit) * 100) : 0;
      return `
      <tr class="${state.selected.has(key.hash) ? "selected" : ""}" data-hash="${key.hash}">
        <td class="checkbox-cell"><input class="key-checkbox" type="checkbox" aria-label="Select ${escapeHtml(key.name)}" ${state.selected.has(key.hash) ? "checked" : ""}></td>
        <td><span class="key-name" title="${escapeHtml(key.name)}">${escapeHtml(key.name)}</span><span class="key-hash">${escapeHtml(key.label || key.hash.slice(0, 16))}</span></td>
        <td><strong>${formatMoney(key.usage)}</strong> / ${hasLimit ? formatMoney(key.limit) : "∞"}<div class="usage-bar"><span style="width:${percentage}%"></span></div></td>
        <td>${formatDate(key.createdAt)}</td>
        <td>${formatExpiry(key.expiresAt)}</td>
        <td><span class="badge ${key.disabled ? "disabled" : ""}">${key.disabled ? "Disabled" : "Active"}</span></td>
        <td><div class="row-actions"><button class="row-action edit" type="button"><i data-lucide="pencil" aria-hidden="true"></i>Edit</button><button class="row-action toggle-status ${key.disabled ? "enable" : "disable"}" data-disabled="${key.disabled ? "false" : "true"}" type="button"><i data-lucide="${key.disabled ? "power" : "ban"}" aria-hidden="true"></i>${key.disabled ? "Enable" : "Disable"}</button><button class="row-action delete" type="button"><i data-lucide="trash-2" aria-hidden="true"></i>Delete</button></div></td>
      </tr>`;
    })
    .join("");
  renderIcons(body);

  renderMetrics();
  renderSelection();
  syncEditingControls();
}

function isOperationActive(operation) {
  return operation.status === "queued" || operation.status === "running";
}

function syncEditingControls() {
  document
    .querySelectorAll("#create-button, #keys-body .row-action, #bulk-bar .button")
    .forEach((element) => {
      element.disabled = state.editingLocked;
    });
}

function setEditingLocked(locked) {
  const changed = state.editingLocked !== locked;
  state.editingLocked = locked;
  document.body.classList.toggle("editing-locked", locked);
  $("#editing-lock-note").hidden = !locked;
  syncEditingControls();

  if (locked && changed) {
    for (const id of ["create-dialog", "edit-dialog", "bulk-edit-dialog"]) {
      const dialog = $(`#${id}`);
      if (dialog.open) dialog.close();
    }
  }
}

function renderOperations() {
  const operations = state.operations.slice(0, 8);
  const activeCount = state.operations.filter(isOperationActive).length;
  const completedCount = state.operations.length - activeCount;
  $("#operations-panel").hidden = operations.length === 0;
  $("#operations-summary").textContent =
    activeCount === 0
      ? "No changes running"
      : `${activeCount} change${activeCount === 1 ? "" : "s"} in progress`;
  $("#clear-completed-button").hidden = completedCount === 0;
  setEditingLocked(activeCount > 0);
  const statusLabels = {
    queued: "Waiting",
    running: "In progress",
    completed: "Done",
    partial: "Done with issues",
    failed: "Failed",
  };
  $("#operations-list").innerHTML = operations
    .map((operation) => {
      const percentage =
        operation.total > 0 ? Math.round((operation.processed / operation.total) * 100) : 0;
      const progressLabel = isOperationActive(operation)
        ? `${operation.processed}/${operation.total}`
        : `${operation.succeeded}/${operation.total} succeeded`;
      return `
      <div class="operation-row ${escapeHtml(operation.status)}">
        <div class="operation-label">
          <strong>${escapeHtml(operation.label)}</strong>
          <span>${formatDate(operation.createdAt)}</span>
        </div>
        <div class="operation-progress">
          <div class="operation-track" role="progressbar" aria-label="${escapeHtml(operation.label)} progress" aria-valuemin="0" aria-valuemax="${operation.total}" aria-valuenow="${operation.processed}"><span style="width:${percentage}%"></span></div>
          <span>${progressLabel}</span>
        </div>
        <div class="operation-actions">
          <span class="operation-state ${escapeHtml(operation.status)}">${statusLabels[operation.status] ?? escapeHtml(operation.status)}</span>
        </div>
      </div>`;
    })
    .join("");
  renderIcons($("#operations-list"));
}

function scheduleOperationsPoll() {
  clearTimeout(operationsPollTimer);
  if (state.operations.some(isOperationActive)) {
    operationsPollTimer = setTimeout(loadOperations, 1000);
  }
}

async function revealCreateOperation(id) {
  if (state.revealedCreateOperations.has(id)) return;
  const payload = await api(`/api/operations/${id}`);
  const created = payload.data.result?.created;
  if (Array.isArray(created) && created.length > 0) {
    state.revealedCreateOperations.add(id);
    showSecrets(created);
  }
}

async function loadOperations() {
  if (operationsLoading) return;
  operationsLoading = true;
  const previous = new Map(state.operations.map((operation) => [operation.id, operation]));

  try {
    const payload = await api("/api/operations");
    state.operations = payload.data;
    renderOperations();

    const newlyFinished = state.operations.filter((operation) => {
      const prior = previous.get(operation.id);
      return prior && isOperationActive(prior) && !isOperationActive(operation);
    });

    if (newlyFinished.length > 0) {
      await loadKeys();
    }

    for (const operation of newlyFinished) {
      if (
        operation.kind === "create" &&
        operation.status === "completed" &&
        state.ownedCreateOperations.has(operation.id)
      ) {
        await revealCreateOperation(operation.id);
      }
    }
  } catch (error) {
    showToast(error.message, true);
  } finally {
    operationsLoading = false;
    scheduleOperationsPoll();
  }
}

function trackOperation(operation, revealCreatedKeys = false) {
  state.operations = [
    operation,
    ...state.operations.filter((candidate) => candidate.id !== operation.id),
  ];
  if (revealCreatedKeys) {
    state.ownedCreateOperations.add(operation.id);
  }
  renderOperations();
  scheduleOperationsPoll();
}

async function loadStatus() {
  try {
    const status = await api("/api/status");
    $("#account-name").textContent = status.accountName || "Not configured";
    $("#workspace-name").textContent = status.workspace.name;
    $("#guardrail-name").textContent = status.guardrail.name;
    state.availableModelCount = status.guardrail.availableModelCount;
    $("#metric-credits").textContent = formatMoney(status.credits.availableCredits);
    $("#sidebar-model-list").innerHTML =
      status.guardrail.availableModels.length > 0
        ? status.guardrail.availableModels
            .map((model) => `<li title="${escapeHtml(model.id)}">${escapeHtml(model.name)}</li>`)
            .join("")
        : "<li>All catalog models permitted</li>";
    renderMetrics();
    $("#connection-label").textContent = `${status.workspace.name} connected`;
    $(".connection-dot").classList.add("online");
    $(".connection-dot").classList.remove("error");
  } catch (error) {
    $("#connection-label").textContent = "Configuration error";
    $(".connection-dot").classList.add("error");
    showToast(error.message, true);
    throw error;
  }
}

async function loadKeys() {
  const payload = await api("/api/keys");
  state.keys = payload.data;
  state.selected = new Set(
    [...state.selected].filter((hash) => state.keys.some((key) => key.hash === hash)),
  );
  renderKeys();
}

async function refresh() {
  const button = $("#refresh-button");
  button.disabled = true;
  try {
    await Promise.all([
      loadStatus(),
      loadKeys(),
      loadOperations(),
      loadAzureContext().catch(() => null),
    ]);
  } catch (error) {
    if (!$("#toast").classList.contains("error")) showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function setConnection(label, status) {
  $("#connection-label").textContent = label;
  $(".connection-dot").classList.toggle("online", status === "online");
  $(".connection-dot").classList.toggle("error", status === "error");
}

function filteredRedeemKeys() {
  const query = $("#redeem-search-input").value.trim().toLocaleLowerCase(LOCALE);
  if (!query) return state.redeemKeys;
  return state.redeemKeys.filter(
    (key) =>
      key.label.toLocaleLowerCase(LOCALE).includes(query) ||
      key.code.toLocaleLowerCase(LOCALE).includes(query) ||
      key.accessText.toLocaleLowerCase(LOCALE).includes(query),
  );
}

function redeemStatus(key) {
  if (!key.enabled) return { label: "Disabled", className: "disabled" };
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) {
    return { label: "Expired", className: "disabled" };
  }
  return { label: "Active", className: "" };
}

function renderRedeemSelection() {
  const visible = filteredRedeemKeys();
  const selectedVisible = visible.filter((key) => state.redeemSelected.has(key.code));
  const selectedKeys = state.redeemKeys.filter((key) => state.redeemSelected.has(key.code));
  const hasEnabledKeys = selectedKeys.some((key) => key.enabled);
  const hasDisabledKeys = selectedKeys.some((key) => !key.enabled);

  $("#redeem-bulk-bar").hidden = selectedKeys.length === 0;
  $("#redeem-selected-count").textContent = selectedKeys.length;
  $("#redeem-bulk-enable-button").hidden = !hasDisabledKeys;
  $("#redeem-bulk-disable-button").hidden = !hasEnabledKeys;
  $("#redeem-select-all").checked = visible.length > 0 && selectedVisible.length === visible.length;
  $("#redeem-select-all").indeterminate =
    selectedVisible.length > 0 && selectedVisible.length < visible.length;
}

function renderRedeemKeys() {
  const keys = filteredRedeemKeys();
  const now = new Date();
  const active = state.redeemKeys.filter(
    (key) => key.enabled && (!key.expiresAt || new Date(key.expiresAt) > now),
  ).length;
  const expired = state.redeemKeys.filter(
    (key) => key.expiresAt && new Date(key.expiresAt) <= now,
  ).length;

  $("#redeem-metric-total").textContent = state.redeemKeys.length;
  $("#redeem-metric-active").textContent = active;
  $("#redeem-metric-expired").textContent = expired;
  $("#redeem-result-count").textContent = `${keys.length} of ${state.redeemKeys.length} keys`;
  $("#redeem-empty-state").hidden = keys.length > 0;
  $("#redeem-table-wrap").hidden = keys.length === 0;

  $("#redeem-keys-body").innerHTML = keys
    .map((key) => {
      const status = redeemStatus(key);
      return `
      <tr class="${state.redeemSelected.has(key.code) ? "selected" : ""}" data-code="${escapeHtml(key.code)}">
        <td class="checkbox-cell"><input class="redeem-key-checkbox" type="checkbox" aria-label="Select ${escapeHtml(key.label)}" ${state.redeemSelected.has(key.code) ? "checked" : ""}></td>
        <td><span class="key-name" title="${escapeHtml(key.label)}">${escapeHtml(key.label)}</span><span class="key-hash">${escapeHtml(key.code)}</span></td>
        <td><span class="access-preview" title="${escapeHtml(key.accessText)}">${escapeHtml(key.accessText)}</span></td>
        <td>${formatDate(key.createdAt)}</td>
        <td>${formatExpiry(key.expiresAt)}</td>
        <td><span class="badge ${status.className}">${status.label}</span></td>
        <td><div class="row-actions"><button class="row-action copy-redeem" type="button"><i data-lucide="copy" aria-hidden="true"></i>Copy</button><button class="row-action edit-redeem" type="button"><i data-lucide="pencil" aria-hidden="true"></i>Edit</button><button class="row-action toggle-redeem-status ${key.enabled ? "disable" : "enable"}" type="button"><i data-lucide="${key.enabled ? "ban" : "power"}" aria-hidden="true"></i>${key.enabled ? "Disable" : "Enable"}</button><button class="row-action delete-redeem" type="button"><i data-lucide="trash-2" aria-hidden="true"></i>Delete</button></div></td>
      </tr>`;
    })
    .join("");
  renderIcons($("#redeem-keys-body"));
  renderRedeemSelection();
}

function renderAzureContext(status) {
  $("#azure-subscription").textContent = status.subscriptionName || "Not configured";
  $("#azure-resource-location").textContent =
    `${status.resourceGroup || "Not configured"} · austriaeast`;
}

async function loadAzureContext() {
  const status = await api("/api/redeem-access/status");
  renderAzureContext(status);
  return status;
}

async function loadRedeemAccess() {
  const [status, payload] = await Promise.all([
    loadAzureContext().catch(() => null),
    api("/api/redeem-access/keys"),
  ]);
  state.redeemKeys = payload.data;
  state.redeemSelected = new Set(
    [...state.redeemSelected].filter((code) => state.redeemKeys.some((key) => key.code === code)),
  );
  if (status) {
    $("#redeem-storage-account").textContent = status.accountName;
    $("#redeem-table-name").textContent = status.tableName;
  }
  setConnection(`${status?.tableName || "Storage"} connected`, "online");
  renderRedeemKeys();
}

async function refreshRedeemAccess() {
  const button = $("#refresh-button");
  button.disabled = true;
  try {
    await loadRedeemAccess();
  } catch (error) {
    setConnection("Storage configuration error", "error");
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function filteredEnvironments() {
  const query = $("#environment-search-input").value.trim().toLocaleLowerCase(LOCALE);
  if (!query) return state.environments;
  return state.environments.filter((environment) =>
    [environment.name, environment.publicHost, environment.status, environment.provisioningState]
      .join(" ")
      .toLocaleLowerCase(LOCALE)
      .includes(query),
  );
}

function renderEnvironmentMetrics() {
  const running = state.environments.filter(
    ({ status }) => status.toLocaleLowerCase(LOCALE) === "running",
  ).length;
  const stopped = state.environments.filter(({ status }) =>
    ["stopped", "terminated", "deallocated"].includes(status.toLocaleLowerCase(LOCALE)),
  ).length;
  $("#environment-metric-total").textContent = state.environments.length;
  $("#environment-metric-running").textContent = running;
  $("#environment-metric-stopped").textContent = stopped;
  $("#environment-metric-redeem").textContent = state.environments.filter(
    ({ redeemCode }) => redeemCode,
  ).length;
}

function renderEnvironmentSelection() {
  const visible = filteredEnvironments();
  const selectedVisible = visible.filter(({ name }) => state.environmentSelected.has(name));
  $("#environment-bulk-bar").hidden = state.environmentSelected.size === 0;
  $("#environment-selected-count").textContent = state.environmentSelected.size;
  $("#environment-select-all").checked =
    visible.length > 0 && selectedVisible.length === visible.length;
  $("#environment-select-all").indeterminate =
    selectedVisible.length > 0 && selectedVisible.length < visible.length;
  const selected = state.environments.filter(({ name }) => state.environmentSelected.has(name));
  $("#environment-bulk-redeem").disabled = selected.every(({ redeemCode }) => redeemCode);
}

function environmentStatusClass(status) {
  const normalized = status.toLocaleLowerCase(LOCALE);
  if (normalized === "running") return "";
  if (["stopped", "terminated", "deallocated"].includes(normalized)) return "disabled";
  return "expired";
}

function renderEnvironments() {
  const environments = filteredEnvironments();
  $("#environment-result-count").textContent =
    `${environments.length} of ${state.environments.length} environments`;
  $("#environment-empty-state").hidden = environments.length > 0;
  $("#environment-table-wrap").hidden = environments.length === 0;
  $("#environment-body").innerHTML = environments
    .map(
      (environment) => `
      <tr class="${state.environmentSelected.has(environment.name) ? "selected" : ""}" data-name="${escapeHtml(environment.name)}">
        <td class="checkbox-cell"><input class="environment-checkbox" type="checkbox" aria-label="Select ${escapeHtml(environment.name)}" ${state.environmentSelected.has(environment.name) ? "checked" : ""}></td>
        <td><span class="key-name" title="${escapeHtml(environment.name)}">${escapeHtml(environment.name)}</span><span class="key-hash">${escapeHtml(environment.publicHost)}</span></td>
        <td><a href="${escapeHtml(environment.codeServerUrl)}" target="_blank" rel="noreferrer">Open Code Server</a><button class="inline-copy copy-environment-password" type="button"><i data-lucide="copy" aria-hidden="true"></i>Copy password</button></td>
        <td><a href="${escapeHtml(environment.devUrl)}" target="_blank" rel="noreferrer">Open app</a></td>
        <td>${formatDate(environment.createdAt)}</td>
        <td><span class="badge ${environmentStatusClass(environment.status)}">${escapeHtml(environment.status)}</span><span class="key-hash">${escapeHtml(environment.provisioningState)}</span></td>
        <td>${environment.redeemCode ? `<button class="inline-copy copy-environment-redeem" type="button"><i data-lucide="copy" aria-hidden="true"></i>${escapeHtml(environment.redeemCode)}</button>` : `<button class="row-action add-environment-redeem" type="button"><i data-lucide="ticket-plus" aria-hidden="true"></i>Add key</button>`}</td>
        <td><div class="row-actions"><button class="row-action start-environment" type="button"><i data-lucide="play" aria-hidden="true"></i>Start</button><button class="row-action stop-environment" type="button"><i data-lucide="square" aria-hidden="true"></i>Stop</button><button class="row-action delete-environment" type="button"><i data-lucide="trash-2" aria-hidden="true"></i>Delete</button></div></td>
      </tr>`,
    )
    .join("");
  renderIcons($("#environment-body"));
  renderEnvironmentMetrics();
  renderEnvironmentSelection();
  const locked = state.environmentOperation?.status === "running";
  document
    .querySelectorAll("#environment-body button, #environment-bulk-bar button")
    .forEach((button) => {
      button.disabled = locked;
    });
  const selected = state.environments.filter(({ name }) => state.environmentSelected.has(name));
  $("#environment-bulk-redeem").disabled = locked || selected.every(({ redeemCode }) => redeemCode);
  $("#create-environments-button").disabled = !state.environmentConfigured || locked;
}

function renderEnvironmentOperation() {
  const operation = state.environmentOperation;
  const panel = $("#environment-operation-panel");
  panel.hidden = !operation;
  clearTimeout(environmentPollTimer);
  if (!operation) return;

  panel.dataset.status = operation.status;
  $("#environment-operation-label").textContent = operation.label;
  $("#environment-operation-detail").textContent = operation.detail || "Working…";
  const status = $("#environment-operation-status");
  status.className = `operation-state ${operation.status}`;
  status.textContent = {
    running: "In progress",
    completed: "Done",
    partial: "Done with issues",
    failed: "Failed",
  }[operation.status];
  $("#environment-clear-completed-button").hidden = operation.status === "running";
  const percentage = operation.total
    ? Math.round((operation.processed / operation.total) * 100)
    : 0;
  const track = $("#environment-operation-track");
  track.setAttribute("aria-valuemax", operation.total);
  track.setAttribute("aria-valuenow", operation.processed);
  track.querySelector("span").style.width = `${percentage}%`;
  $("#environment-operation-summary").textContent =
    `${operation.processed}/${operation.total} · ${operation.succeeded} succeeded${operation.failed.length ? ` · ${operation.failed.length} failed` : ""}`;
  const errors = $("#environment-operation-errors");
  errors.hidden = operation.failed.length === 0;
  errors.innerHTML = operation.failed
    .map(({ name, error }) => `<li><strong>${escapeHtml(name)}</strong>: ${escapeHtml(error)}</li>`)
    .join("");
  const createdWithoutRedeem = operation.createdNames.filter((name) => {
    const environment = state.environments.find((candidate) => candidate.name === name);
    return environment && !environment.redeemCode;
  });
  $("#environment-created-actions").hidden =
    operation.kind !== "create" ||
    operation.status === "running" ||
    createdWithoutRedeem.length === 0;
  $("#redeem-created-environments-button").dataset.names = createdWithoutRedeem.join(",");
  renderEnvironments();
  if (operation.status === "running") {
    environmentPollTimer = setTimeout(() => loadEnvironmentStatus(), 1_500);
  }
}

async function loadEnvironmentStatus(refreshStates = false) {
  const payload = await api(`/api/dev-environments/status${refreshStates ? "?refresh=true" : ""}`);
  state.environmentOperation = payload.operation;
  state.environmentConfigured = payload.configured && Boolean(payload.model);
  state.environments = payload.environments;
  state.environmentModel = payload.model;
  state.environmentSelected = new Set(
    [...state.environmentSelected].filter((name) =>
      state.environments.some((environment) => environment.name === name),
    ),
  );
  $("#environment-resource-location").textContent =
    `${payload.resourceGroup} · ${payload.location}`;
  $("#environment-subscription").textContent = payload.subscriptionName || "Not configured";
  $("#environment-storage-account").textContent = payload.accountName || "Not configured";
  $("#environment-table-name").textContent = payload.tableName;
  $("#environment-image").textContent = payload.image || "Not configured";
  $("#environment-model-id").value = payload.model
    ? `${payload.model.name} (${payload.model.id})`
    : "Exactly one guardrail model is required";
  renderEnvironments();
  renderEnvironmentOperation();
  setConnection(
    state.environmentConfigured
      ? "Azure virtual machines connected"
      : "Virtual machine configuration incomplete",
    state.environmentConfigured ? "online" : "error",
  );
}

async function refreshDevEnvironments() {
  const button = $("#refresh-button");
  button.disabled = true;
  try {
    await loadEnvironmentStatus(true);
  } catch (error) {
    setConnection("Generator error", "error");
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function refreshActiveManager() {
  if (state.activeManager === "redeem-access") return refreshRedeemAccess();
  if (state.activeManager === "dev-environments") return refreshDevEnvironments();
  return refresh();
}

function switchManager(manager) {
  const next = ["openrouter", "redeem-access", "dev-environments"].includes(manager)
    ? manager
    : "openrouter";
  state.activeManager = next;
  document.querySelectorAll("[data-manager-view]").forEach((view) => {
    view.hidden = view.dataset.managerView !== next;
  });
  document.querySelectorAll("[data-manager-context]").forEach((context) => {
    context.hidden = context.dataset.managerContext !== next;
  });
  document.querySelectorAll("[data-manager]").forEach((link) => {
    const active = link.dataset.manager === next;
    link.classList.toggle("active", active);
    active ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });
  $("#refresh-button").setAttribute(
    "aria-label",
    next === "redeem-access"
      ? "Refresh redeem access keys"
      : next === "dev-environments"
        ? "Refresh development environments"
        : "Refresh API keys",
  );
  refreshActiveManager();
}

function setSubmitting(form, submitting) {
  for (const element of form.elements) element.disabled = submitting;
}

function nullableNumber(value) {
  return value === "" ? null : Number(value);
}

function showSecrets(created) {
  state.secrets = created.map((item) => ({
    name: item.data.name,
    key: item.key,
    hash: item.data.hash,
    expiresAt: item.data.expiresAt ?? null,
  }));
  state.redeemedSecretIndexes.clear();
  const generateButton = $("#generate-redeem-keys-button");
  generateButton.disabled = false;
  generateButton.querySelector(".button-label").textContent = "Generate redeem keys";
  $("#secrets-list").innerHTML = state.secrets
    .map(
      (item, index) => `
    <div class="secret-row">
      <strong>${escapeHtml(item.name)}</strong>
      <code>${escapeHtml(item.key)}</code>
      <button type="button" data-copy-secret="${index}"><i data-lucide="copy" aria-hidden="true"></i>Copy</button>
    </div>`,
    )
    .join("");
  renderIcons($("#secrets-list"));
  $("#secrets-dialog").showModal();
}

$("#create-button").addEventListener("click", () => $("#create-dialog").showModal());
$("#refresh-button").addEventListener("click", refreshActiveManager);
$("#search-input").addEventListener("input", renderKeys);
$("#redeem-search-input").addEventListener("input", renderRedeemKeys);
$("#environment-search-input").addEventListener("input", renderEnvironments);
$("#create-environments-button").addEventListener("click", () =>
  $("#create-environments-dialog").showModal(),
);
$("#environment-create-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const count = Number(data.get("count"));
  const confirmed = await requestConfirmation({
    title: `Create ${count} development environment${count === 1 ? "" : "s"}?`,
    message:
      "Ubuntu LTS virtual machines and one OpenRouter API key using the default guardrail per environment will be created.",
    confirmLabel: "Create environments",
  });
  if (!confirmed) return;

  setSubmitting(form, true);
  try {
    const payload = await api("/api/dev-environments", {
      method: "POST",
      body: JSON.stringify({
        count,
        apiKeyLimit: nullableNumber(data.get("apiKeyLimit")),
        apiKeyExpiresAt: data.get("apiKeyExpiresAt")
          ? new Date(data.get("apiKeyExpiresAt")).toISOString()
          : null,
      }),
    });
    state.environmentOperation = payload.operation;
    form.reset();
    $("#environment-count").value = "2";
    setSubmitting(form, false);
    $("#create-environments-dialog").close();
    renderEnvironmentOperation();
    showToast("Development environment creation started");
  } catch (error) {
    setSubmitting(form, false);
    showToast(error.message, true);
  }
});

async function createEnvironmentRedeemKeys(names) {
  const environments = state.environments.filter(
    (environment) => names.includes(environment.name) && !environment.redeemCode,
  );
  if (environments.length === 0) {
    showToast("Every selected environment already has a redeem key", true);
    return;
  }
  try {
    const payload = await api("/api/dev-environments/redeem", {
      method: "POST",
      body: JSON.stringify({ names: environments.map(({ name }) => name) }),
    });
    await loadEnvironmentStatus();
    showToast(
      payload.failed.length === 0
        ? `${payload.data.length} redeem key${payload.data.length === 1 ? "" : "s"} created`
        : `${payload.data.length} redeem keys created; ${payload.failed.length} failed`,
      payload.failed.length > 0,
    );
  } catch (error) {
    showToast(error.message, true);
  }
}

async function startEnvironmentBulkAction(action, names = [...state.environmentSelected]) {
  if (names.length === 0) return;
  if (action === "delete") {
    const confirmed = await requestConfirmation({
      title: `Delete ${names.length} development environment${names.length === 1 ? "" : "s"}?`,
      message:
        "The Azure virtual machines and their saved login records will be permanently deleted.",
      confirmLabel: `Delete ${names.length} environment${names.length === 1 ? "" : "s"}`,
    });
    if (!confirmed) return;
  }
  try {
    const payload = await api("/api/dev-environments/bulk", {
      method: "POST",
      body: JSON.stringify({ names, action }),
    });
    state.environmentOperation = payload.operation;
    state.environmentSelected.clear();
    renderEnvironmentOperation();
    showToast(`${action[0].toUpperCase()}${action.slice(1)} operation started`);
  } catch (error) {
    showToast(error.message, true);
  }
}

$("#environment-body").addEventListener("change", (event) => {
  const checkbox = event.target.closest(".environment-checkbox");
  if (!checkbox) return;
  const name = checkbox.closest("tr").dataset.name;
  checkbox.checked ? state.environmentSelected.add(name) : state.environmentSelected.delete(name);
  renderEnvironments();
});

$("#environment-select-all").addEventListener("change", (event) => {
  for (const environment of filteredEnvironments()) {
    event.target.checked
      ? state.environmentSelected.add(environment.name)
      : state.environmentSelected.delete(environment.name);
  }
  renderEnvironments();
});

$("#environment-clear-selection").addEventListener("click", () => {
  state.environmentSelected.clear();
  renderEnvironments();
});

$("#environment-bulk-start").addEventListener("click", () => startEnvironmentBulkAction("start"));
$("#environment-bulk-stop").addEventListener("click", () => startEnvironmentBulkAction("stop"));
$("#environment-bulk-delete").addEventListener("click", () => startEnvironmentBulkAction("delete"));
$("#environment-bulk-redeem").addEventListener("click", () =>
  createEnvironmentRedeemKeys([...state.environmentSelected]),
);
$("#redeem-created-environments-button").addEventListener("click", (event) =>
  createEnvironmentRedeemKeys(event.currentTarget.dataset.names.split(",").filter(Boolean)),
);

$("#environment-body").addEventListener("click", async (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  const environment = state.environments.find(({ name }) => name === row.dataset.name);
  if (!environment) return;
  if (event.target.closest(".copy-environment-password")) {
    await navigator.clipboard.writeText(environment.codeServerPassword);
    showToast("Environment password copied");
  } else if (event.target.closest(".copy-environment-redeem")) {
    await navigator.clipboard.writeText(environment.redeemCode);
    showToast("Redeem key copied");
  } else if (event.target.closest(".add-environment-redeem")) {
    await createEnvironmentRedeemKeys([environment.name]);
  } else if (event.target.closest(".start-environment")) {
    await startEnvironmentBulkAction("start", [environment.name]);
  } else if (event.target.closest(".stop-environment")) {
    await startEnvironmentBulkAction("stop", [environment.name]);
  } else if (event.target.closest(".delete-environment")) {
    await startEnvironmentBulkAction("delete", [environment.name]);
  }
});
$("#confirm-cancel-button").addEventListener("click", () => resolveConfirmation(false));
$("#confirm-action-button").addEventListener("click", () => resolveConfirmation(true));
$("#confirm-dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  resolveConfirmation(false);
});
$("#confirm-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) resolveConfirmation(false);
});
$("#clear-completed-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const payload = await api("/api/operations/completed", { method: "DELETE" });
    await loadOperations();
    showToast(`${payload.cleared} completed activit${payload.cleared === 1 ? "y" : "ies"} cleared`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$("#environment-clear-completed-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const payload = await api("/api/dev-environments/operations/completed", {
      method: "DELETE",
    });
    await loadEnvironmentStatus();
    showToast(`${payload.cleared} completed activit${payload.cleared === 1 ? "y" : "ies"} cleared`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) $(`#${closeButton.dataset.close}`).close();

  const copyButton = event.target.closest("[data-copy-secret]");
  if (copyButton) {
    navigator.clipboard.writeText(state.secrets[Number(copyButton.dataset.copySecret)].key);
    showToast("API key copied");
  }
});

$("#create-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const common = {
    limit: nullableNumber(data.get("limit")),
    expiresAt: data.get("expiresAt") ? new Date(data.get("expiresAt")).toISOString() : null,
  };

  const body = { ...common, count: Number(data.get("count")) };

  setSubmitting(form, true);
  try {
    const payload = await api("/api/keys/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    });
    form.reset();
    $("#create-count").value = "10";
    $("#create-dialog").close();

    trackOperation(payload.operation, true);
    showToast("Key creation started");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
  }
});

$("#keys-body").addEventListener("change", (event) => {
  const checkbox = event.target.closest(".key-checkbox");
  if (!checkbox) return;
  const hash = checkbox.closest("tr").dataset.hash;
  checkbox.checked ? state.selected.add(hash) : state.selected.delete(hash);
  renderKeys();
});

$("#select-all").addEventListener("change", (event) => {
  for (const key of filteredKeys()) {
    event.target.checked ? state.selected.add(key.hash) : state.selected.delete(key.hash);
  }
  renderKeys();
});

$("#clear-selection-button").addEventListener("click", () => {
  state.selected.clear();
  renderKeys();
});

$("#keys-body").addEventListener("click", async (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  const key = state.keys.find((candidate) => candidate.hash === row.dataset.hash);

  if (event.target.closest(".edit")) {
    $("#edit-hash").value = key.hash;
    $("#edit-name").value = key.name;
    $("#edit-limit").value = key.limit ?? "";
    $("#edit-dialog").showModal();
    return;
  }

  const statusButton = event.target.closest(".toggle-status");
  if (statusButton) {
    const disabled = statusButton.dataset.disabled === "true";
    try {
      const payload = await api(`/api/keys/${key.hash}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled }),
      });
      trackOperation(payload.operation);
      showToast(`${disabled ? "Disable" : "Enable"} operation started for “${key.name}”`);
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  if (event.target.closest(".delete")) {
    const confirmed = await requestConfirmation({
      title: "Delete API key?",
      message: `“${key.name}” will stop working immediately. This action cannot be undone.`,
      confirmLabel: "Delete key",
    });
    if (!confirmed) return;
    try {
      const payload = await api(`/api/keys/${key.hash}`, { method: "DELETE" });
      state.selected.delete(key.hash);
      renderKeys();
      trackOperation(payload.operation);
      showToast("Delete operation started");
    } catch (error) {
      showToast(error.message, true);
    }
  }
});

$("#edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  setSubmitting(form, true);
  try {
    const payload = await api(`/api/keys/${$("#edit-hash").value}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: $("#edit-name").value,
        limit: nullableNumber($("#edit-limit").value),
      }),
    });
    $("#edit-dialog").close();
    trackOperation(payload.operation);
    showToast("Update operation started");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
  }
});

$("#bulk-edit-button").addEventListener("click", () => $("#bulk-edit-dialog").showModal());

$("#bulk-edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const changes = {};
  if ($("#change-limit").checked) changes.limit = nullableNumber($("#bulk-limit").value);

  const form = event.currentTarget;
  const hashes = [...state.selected];
  const submitButton = $("#bulk-edit-submit");
  form.setAttribute("aria-busy", "true");
  submitButton.querySelector(".button-label").textContent = "Starting…";
  setSubmitting(form, true);
  try {
    const payload = await api("/api/keys/bulk", {
      method: "PATCH",
      body: JSON.stringify({ hashes, changes }),
    });
    state.selected.clear();
    renderKeys();
    $("#bulk-edit-dialog").close();
    trackOperation(payload.operation);
    showToast("Bulk edit started");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
    form.removeAttribute("aria-busy");
    submitButton.querySelector(".button-label").textContent = "Apply to selected";
  }
});

async function setSelectedKeysDisabled(disabled) {
  const hashes = [...state.selected];
  const actionButton = disabled ? $("#bulk-disable-button") : $("#bulk-enable-button");
  const idleLabel = disabled ? "Disable selected" : "Enable selected";
  const bulkButtons = document.querySelectorAll("#bulk-bar button");

  bulkButtons.forEach((button) => {
    button.disabled = true;
  });
  actionButton.querySelector(".button-label").textContent = "Starting…";
  try {
    const payload = await api("/api/keys/bulk", {
      method: "PATCH",
      body: JSON.stringify({ hashes, changes: { disabled } }),
    });
    state.selected.clear();
    renderKeys();
    trackOperation(payload.operation);
    showToast(`Bulk ${disabled ? "disable" : "enable"} started`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    bulkButtons.forEach((button) => {
      button.disabled = false;
    });
    actionButton.querySelector(".button-label").textContent = idleLabel;
  }
}

$("#bulk-enable-button").addEventListener("click", () => setSelectedKeysDisabled(false));
$("#bulk-disable-button").addEventListener("click", () => setSelectedKeysDisabled(true));

$("#bulk-delete-button").addEventListener("click", async () => {
  const count = state.selected.size;
  const confirmed = await requestConfirmation({
    title: `Delete ${count} selected key${count === 1 ? "" : "s"}?`,
    message: "The selected keys will stop working immediately. This action cannot be undone.",
    confirmLabel: `Delete ${count} key${count === 1 ? "" : "s"}`,
  });
  if (!confirmed) return;
  const bulkButtons = document.querySelectorAll("#bulk-bar button");
  const deleteButton = $("#bulk-delete-button");
  bulkButtons.forEach((button) => {
    button.disabled = true;
  });
  deleteButton.querySelector(".button-label").textContent = "Starting…";
  try {
    const payload = await api("/api/keys/bulk", {
      method: "DELETE",
      body: JSON.stringify({ hashes: [...state.selected] }),
    });
    state.selected.clear();
    renderKeys();
    trackOperation(payload.operation);
    showToast("Bulk delete started");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    bulkButtons.forEach((button) => {
      button.disabled = false;
    });
    deleteButton.querySelector(".button-label").textContent = "Delete selected";
  }
});

$("#copy-all-button").addEventListener("click", () => {
  navigator.clipboard.writeText(
    state.secrets.map((item) => `${item.name}\t${item.key}`).join("\n"),
  );
  showToast("All API keys copied");
});

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(filename, header, rows) {
  const csv = [header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

$("#download-csv-button").addEventListener("click", () => {
  downloadCsv(
    `hackathon-openrouter-keys-${new Date().toISOString().slice(0, 10)}.csv`,
    ["name", "key"],
    state.secrets.map((item) => [item.name, item.key]),
  );
});

$("#generate-redeem-keys-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const pending = state.secrets
    .map((secret, index) => ({ secret, index }))
    .filter(({ index }) => !state.redeemedSecretIndexes.has(index));
  if (pending.length === 0) return;

  button.disabled = true;
  button.querySelector(".button-label").textContent = "Generating…";
  try {
    const payload = await api("/api/redeem-access/keys/bulk", {
      method: "POST",
      body: JSON.stringify({
        items: pending.map(({ secret }) => ({
          label: `AI API key "${secret.name}"`,
          accessText: secret.key,
          apiKeyHash: secret.hash,
          expiresAt: secret.expiresAt,
        })),
      }),
    });
    for (const result of payload.data) {
      state.redeemedSecretIndexes.add(pending[result.index].index);
    }

    const remaining = state.secrets.length - state.redeemedSecretIndexes.size;
    button.disabled = remaining === 0;
    button.querySelector(".button-label").textContent =
      remaining === 0 ? "Redeem keys generated" : `Retry ${remaining} failed`;
    showToast(
      remaining === 0
        ? `${payload.data.length} redeem key${payload.data.length === 1 ? "" : "s"} generated`
        : `${payload.data.length} generated; ${remaining} failed`,
      remaining > 0,
    );
  } catch (error) {
    button.disabled = false;
    button.querySelector(".button-label").textContent = "Generate redeem keys";
    showToast(error.message, true);
  }
});

$("#create-redeem-button").addEventListener("click", () => $("#create-redeem-dialog").showModal());

$("#create-redeem-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  setSubmitting(form, true);
  try {
    const payload = await api("/api/redeem-access/keys", {
      method: "POST",
      body: JSON.stringify({
        label: data.get("label"),
        code: data.get("code"),
        accessText: data.get("accessText"),
        expiresAt: data.get("expiresAt") ? new Date(data.get("expiresAt")).toISOString() : null,
      }),
    });
    form.reset();
    $("#create-redeem-dialog").close();
    await loadRedeemAccess();
    showToast(`Redeem access key ${payload.data.code} created`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
  }
});

$("#redeem-keys-body").addEventListener("change", (event) => {
  const checkbox = event.target.closest(".redeem-key-checkbox");
  if (!checkbox) return;
  const code = checkbox.closest("tr").dataset.code;
  checkbox.checked ? state.redeemSelected.add(code) : state.redeemSelected.delete(code);
  renderRedeemKeys();
});

$("#redeem-select-all").addEventListener("change", (event) => {
  for (const key of filteredRedeemKeys()) {
    event.target.checked
      ? state.redeemSelected.add(key.code)
      : state.redeemSelected.delete(key.code);
  }
  renderRedeemKeys();
});

$("#redeem-clear-selection-button").addEventListener("click", () => {
  state.redeemSelected.clear();
  renderRedeemKeys();
});

$("#redeem-bulk-edit-button").addEventListener("click", () => {
  $("#bulk-edit-redeem-dialog").showModal();
});

async function updateSelectedRedeemKeys(changes) {
  const payload = await api("/api/redeem-access/keys/bulk", {
    method: "PATCH",
    body: JSON.stringify({ codes: [...state.redeemSelected], changes }),
  });
  const failedCount = payload.failed.length;
  const updatedCount = payload.data.length;
  const failedCodes = new Set(payload.failed.map((failure) => failure.code));
  state.redeemSelected = new Set(
    [...state.redeemSelected].filter((code) => failedCodes.has(code.replaceAll("-", ""))),
  );
  await loadRedeemAccess();
  return { failedCount, updatedCount };
}

$("#bulk-edit-redeem-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const changes = {};
  if ($("#redeem-change-expires").checked) {
    changes.expiresAt = $("#redeem-bulk-expires").value
      ? new Date($("#redeem-bulk-expires").value).toISOString()
      : null;
  }
  if (Object.keys(changes).length === 0) {
    showToast("Select at least one property to edit", true);
    return;
  }

  const form = event.currentTarget;
  const button = $("#redeem-bulk-edit-submit");
  setSubmitting(form, true);
  button.querySelector(".button-label").textContent = "Applying…";
  try {
    const { failedCount, updatedCount } = await updateSelectedRedeemKeys(changes);
    form.reset();
    $("#bulk-edit-redeem-dialog").close();
    showToast(
      failedCount === 0
        ? `${updatedCount} redeem key${updatedCount === 1 ? "" : "s"} updated`
        : `${updatedCount} updated; ${failedCount} failed`,
      failedCount > 0,
    );
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
    button.querySelector(".button-label").textContent = "Apply to selected";
  }
});

async function setSelectedRedeemKeysEnabled(enabled) {
  const button = enabled ? $("#redeem-bulk-enable-button") : $("#redeem-bulk-disable-button");
  const idleLabel = enabled ? "Enable selected" : "Disable selected";
  const buttons = document.querySelectorAll("#redeem-bulk-bar button");
  buttons.forEach((candidate) => {
    candidate.disabled = true;
  });
  button.querySelector(".button-label").textContent = "Applying…";
  try {
    const { failedCount, updatedCount } = await updateSelectedRedeemKeys({ enabled });
    showToast(
      failedCount === 0
        ? `${updatedCount} redeem key${updatedCount === 1 ? "" : "s"} ${enabled ? "enabled" : "disabled"}`
        : `${updatedCount} updated; ${failedCount} failed`,
      failedCount > 0,
    );
  } catch (error) {
    showToast(error.message, true);
  } finally {
    buttons.forEach((candidate) => {
      candidate.disabled = false;
    });
    button.querySelector(".button-label").textContent = idleLabel;
  }
}

$("#redeem-bulk-enable-button").addEventListener("click", () => setSelectedRedeemKeysEnabled(true));
$("#redeem-bulk-disable-button").addEventListener("click", () =>
  setSelectedRedeemKeysEnabled(false),
);

$("#redeem-bulk-delete-button").addEventListener("click", async () => {
  const codes = [...state.redeemSelected];
  const confirmed = await requestConfirmation({
    title: `Delete ${codes.length} redeem access key${codes.length === 1 ? "" : "s"}?`,
    message: "The selected access codes will stop resolving immediately. This cannot be undone.",
    confirmLabel: `Delete ${codes.length} key${codes.length === 1 ? "" : "s"}`,
  });
  if (!confirmed) return;

  const button = $("#redeem-bulk-delete-button");
  const buttons = document.querySelectorAll("#redeem-bulk-bar button");
  buttons.forEach((candidate) => {
    candidate.disabled = true;
  });
  button.querySelector(".button-label").textContent = "Deleting…";
  try {
    const payload = await api("/api/redeem-access/keys/bulk", {
      method: "DELETE",
      body: JSON.stringify({ codes }),
    });
    const failedCodes = new Set(payload.failed.map(({ code }) => code));
    state.redeemSelected = new Set(
      codes.filter((code) => failedCodes.has(code.replaceAll("-", ""))),
    );
    await loadRedeemAccess();
    showToast(
      payload.failed.length === 0
        ? `${payload.data.length} redeem key${payload.data.length === 1 ? "" : "s"} deleted`
        : `${payload.data.length} deleted; ${payload.failed.length} failed`,
      payload.failed.length > 0,
    );
  } catch (error) {
    showToast(error.message, true);
  } finally {
    buttons.forEach((candidate) => {
      candidate.disabled = false;
    });
    button.querySelector(".button-label").textContent = "Delete selected";
  }
});

$("#redeem-download-csv-button").addEventListener("click", () => {
  const selected = state.redeemKeys.filter((key) => state.redeemSelected.has(key.code));
  downloadCsv(
    `hackathon-redeem-keys-${new Date().toISOString().slice(0, 10)}.csv`,
    ["label", "key"],
    selected.map((key) => [key.label, key.code]),
  );
  showToast(`${selected.length} redeem key${selected.length === 1 ? "" : "s"} downloaded`);
});

$("#redeem-keys-body").addEventListener("click", async (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  const key = state.redeemKeys.find((candidate) => candidate.code === row.dataset.code);
  if (!key) return;

  if (event.target.closest(".copy-redeem")) {
    navigator.clipboard.writeText(key.code);
    showToast("Redeem code copied");
    return;
  }

  if (event.target.closest(".edit-redeem")) {
    $("#edit-redeem-code").value = key.code;
    $("#edit-redeem-etag").value = key.etag;
    $("#edit-redeem-label").value = key.label;
    $("#edit-redeem-access-text").value = key.accessText;
    $("#edit-redeem-expires").value = key.expiresAt
      ? new Date(
          new Date(key.expiresAt).valueOf() - new Date(key.expiresAt).getTimezoneOffset() * 60_000,
        )
          .toISOString()
          .slice(0, 16)
      : "";
    $("#edit-redeem-dialog").showModal();
    return;
  }

  if (event.target.closest(".toggle-redeem-status")) {
    try {
      await api(`/api/redeem-access/keys/${encodeURIComponent(key.code)}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !key.enabled, etag: key.etag }),
      });
      await loadRedeemAccess();
      showToast(`“${key.label}” ${key.enabled ? "disabled" : "enabled"}`);
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  if (event.target.closest(".delete-redeem")) {
    const confirmed = await requestConfirmation({
      title: "Delete redeem access key?",
      message: `“${key.label}” will stop resolving immediately. This action cannot be undone.`,
      confirmLabel: "Delete access key",
    });
    if (!confirmed) return;
    try {
      await api(
        `/api/redeem-access/keys/${encodeURIComponent(key.code)}?etag=${encodeURIComponent(key.etag)}`,
        {
          method: "DELETE",
        },
      );
      await loadRedeemAccess();
      showToast("Redeem access key deleted");
    } catch (error) {
      showToast(error.message, true);
    }
  }
});

$("#edit-redeem-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  setSubmitting(form, true);
  try {
    await api(`/api/redeem-access/keys/${encodeURIComponent($("#edit-redeem-code").value)}`, {
      method: "PATCH",
      body: JSON.stringify({
        label: $("#edit-redeem-label").value,
        accessText: $("#edit-redeem-access-text").value,
        expiresAt: $("#edit-redeem-expires").value
          ? new Date($("#edit-redeem-expires").value).toISOString()
          : null,
        etag: $("#edit-redeem-etag").value,
      }),
    });
    $("#edit-redeem-dialog").close();
    await loadRedeemAccess();
    showToast("Redeem access key updated");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSubmitting(form, false);
  }
});

window.addEventListener("hashchange", () => switchManager(location.hash.slice(1)));

renderIcons();
switchManager(location.hash.slice(1));
