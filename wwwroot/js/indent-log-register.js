"use strict";

const API_URL = "/api/indent-log-register";
const token = sessionStorage.getItem("token");
const tbody = document.getElementById("registerTableBody");
const searchInput = document.getElementById("searchInput");
const pageMessage = document.getElementById("pageMessage");
const rowCount = document.getElementById("rowCount");
const footerSummary = document.getElementById("footerSummary");
let rows = [];

if (!token) {
  window.location.replace("/pages/login.html");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function showMessage(message, kind = "success") {
  pageMessage.textContent = message;
  pageMessage.className = `message show ${kind}`;
}
function clearMessage() {
  pageMessage.textContent = "";
  pageMessage.className = "message";
}
function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      "Authorization": `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.replace("/pages/login.html");
    return null;
  }
  if (response.status === 403) {
    throw new Error("This register is available only to CHT-Clerk and CHT-CIO logins.");
  }
  return response;
}

async function loadRegister() {
  clearMessage();
  tbody.innerHTML = `<tr><td colspan="9" class="table-state">Loading log register…</td></tr>`;
  try {
    const response = await apiRequest(API_URL);
    if (!response) return;
    if (!response.ok) throw new Error(await readError(response));
    rows = await response.json();
    renderRows();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-state">${escapeHtml(error.message || "Unable to load log register.")}</td></tr>`;
    rowCount.textContent = "0";
    footerSummary.textContent = "Unable to load records.";
    showMessage(error.message || "Unable to load log register.", "error");
  }
}

function renderRows() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(row =>
    [row.serNo, row.date, row.from, row.to, row.contentOfMsg, row.chtClk, row.oicCht, row.remarks, row.workflowStatus]
      .some(value => String(value ?? "").toLowerCase().includes(q))
  );
  rowCount.textContent = String(filtered.length);
  footerSummary.textContent = `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-state">No log records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${escapeHtml(row.serNo)}</td>
      <td>${escapeHtml(displayDate(row.date))}</td>
      <td>${escapeHtml(row.from || "—")}</td>
      <td>${escapeHtml(row.to || "—")}</td>
      <td class="message-cell">${escapeHtml(row.contentOfMsg || "—")}</td>
      <td><span class="status-text">${escapeHtml(row.chtClk || "—")}</span></td>
      <td><span class="status-text">${escapeHtml(row.oicCht || "—")}</span></td>
      <td><textarea class="remarks-input" data-remarks-input="${row.serNo}" maxlength="1000" aria-label="Remarks for log ${row.serNo}">${escapeHtml(row.remarks || "")}</textarea></td>
      <td><button type="button" class="save-button" data-save-remarks="${row.serNo}">Save remarks</button><div class="row-message" data-row-message="${row.serNo}" aria-live="polite"></div></td>
    </tr>
  `).join("");
}

async function saveRemarks(id, button) {
  const input = tbody.querySelector(`[data-remarks-input="${id}"]`);
  const message = tbody.querySelector(`[data-row-message="${id}"]`);
  if (!input) return;
  button.disabled = true;
  button.textContent = "Saving…";
  if (message) message.textContent = "";

  try {
    const response = await apiRequest(`${API_URL}/${id}/remarks`, {
      method: "PUT",
      body: JSON.stringify({ remarks: input.value })
    });
    if (!response) return;
    const data = await readJson(response);
    if (!response.ok) throw new Error(data?.message || "Could not save remarks.");
    const row = rows.find(x => Number(x.serNo) === Number(id));
    if (row) row.remarks = data.remarks ?? null;
    if (message) message.textContent = "Saved";
    showMessage("Log register remarks saved.");
  } catch (error) {
    if (message) message.textContent = error.message || "Save failed";
    showMessage(error.message || "Could not save remarks.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Save remarks";
  }
}

async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}
async function readError(response) {
  const body = await readJson(response);
  return body?.message || `Request failed (HTTP ${response.status}).`;
}

document.getElementById("refreshButton").addEventListener("click", loadRegister);
searchInput.addEventListener("input", renderRows);
tbody.addEventListener("click", event => {
  const button = event.target.closest("[data-save-remarks]");
  if (button) saveRemarks(Number(button.dataset.saveRemarks), button);
});

loadRegister();
