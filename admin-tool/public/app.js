const state = {
  keys: [],
  selected: new Set(),
  createMode: "single",
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
};
const LOCALE = "de-AT";

let operationsLoading = false;
let operationsPollTimer;
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
      const canViewKeys =
        operation.kind === "create" && operation.hasResult && operation.status === "completed";

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
          ${canViewKeys ? `<button class="operation-view" type="button" data-view-operation="${operation.id}"><i data-lucide="eye" aria-hidden="true"></i>View keys</button>` : ""}
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
    $("#workspace-name").textContent = status.workspace.name;
    $("#guardrail-name").textContent = status.guardrail.name;
    $("#create-guardrail-name").textContent = status.guardrail.name;
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
    await Promise.all([loadStatus(), loadKeys(), loadOperations(), loadAzureContext()]);
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
  const subscription = status.subscriptionName
    ? `${status.subscriptionName}${status.subscriptionId ? ` · ${status.subscriptionId}` : ""}`
    : status.subscriptionId;
  $("#azure-subscription").textContent = subscription || "Not configured";
  $("#azure-tenant").textContent = status.tenantId || "Not configured";
  $("#azure-resource-group").textContent = status.resourceGroup || "Not configured";
}

async function loadAzureContext() {
  const status = await api("/api/redeem-access/status");
  renderAzureContext(status);
  return status;
}

async function loadRedeemAccess() {
  const [status, payload] = await Promise.all([loadAzureContext(), api("/api/redeem-access/keys")]);
  state.redeemKeys = payload.data;
  state.redeemSelected = new Set(
    [...state.redeemSelected].filter((code) => state.redeemKeys.some((key) => key.code === code)),
  );
  $("#redeem-storage-account").textContent = status.accountName;
  $("#redeem-table-name").textContent = status.tableName;
  setConnection(`${status.tableName} connected`, "online");
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

function refreshActiveManager() {
  return state.activeManager === "redeem-access" ? refreshRedeemAccess() : refresh();
}

function switchManager(manager) {
  const next = manager === "redeem-access" ? "redeem-access" : "openrouter";
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
    next === "redeem-access" ? "Refresh redeem access keys" : "Refresh API keys",
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

document.addEventListener("click", async (event) => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) $(`#${closeButton.dataset.close}`).close();

  const modeButton = event.target.closest("[data-create-mode]");
  if (modeButton) {
    state.createMode = modeButton.dataset.createMode;
    document.querySelectorAll("[data-create-mode]").forEach((button) => {
      button.classList.toggle("active", button === modeButton);
    });
    $("#single-name-field").hidden = state.createMode !== "single";
    $("#bulk-names-field").hidden = state.createMode !== "bulk";
  }

  const copyButton = event.target.closest("[data-copy-secret]");
  if (copyButton) {
    navigator.clipboard.writeText(state.secrets[Number(copyButton.dataset.copySecret)].key);
    showToast("API key copied");
  }

  const operationButton = event.target.closest("[data-view-operation]");
  if (operationButton) {
    try {
      await revealCreateOperation(operationButton.dataset.viewOperation);
    } catch (error) {
      showToast(error.message, true);
    }
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

  const path = state.createMode === "bulk" ? "/api/keys/bulk" : "/api/keys";
  const body =
    state.createMode === "bulk"
      ? {
          ...common,
          names: String(data.get("names"))
            .split(/\r?\n/)
            .map((name) => name.trim())
            .filter(Boolean),
        }
      : { ...common, name: data.get("name") };

  setSubmitting(form, true);
  try {
    const payload = await api(path, { method: "POST", body: JSON.stringify(body) });
    const wasBulkCreate = state.createMode === "bulk";
    form.reset();
    $("#create-dialog").close();

    if (wasBulkCreate) {
      trackOperation(payload.operation, true);
      showToast("Bulk key creation started");
    } else {
      showSecrets([payload.data]);
      await loadKeys();
      showToast("Key created and assigned");
    }
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
      await api(`/api/keys/${key.hash}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled }),
      });
      await loadKeys();
      showToast(`“${key.name}” ${disabled ? "disabled" : "enabled"}`);
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
      await api(`/api/keys/${key.hash}`, { method: "DELETE" });
      state.selected.delete(key.hash);
      await loadKeys();
      showToast("API key deleted");
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
    await api(`/api/keys/${$("#edit-hash").value}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: $("#edit-name").value,
        limit: nullableNumber($("#edit-limit").value),
      }),
    });
    $("#edit-dialog").close();
    await loadKeys();
    showToast("API key updated");
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
  if ($("#redeem-change-label").checked) changes.label = $("#redeem-bulk-label").value;
  if ($("#redeem-change-access-text").checked) {
    changes.accessText = $("#redeem-bulk-access-text").value;
  }
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
