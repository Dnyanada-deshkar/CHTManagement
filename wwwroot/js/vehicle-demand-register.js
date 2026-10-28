"use strict";

const API_URL = "/api/vehicle-demand-register";
const token = sessionStorage.getItem("token");
const tbody = document.getElementById("registerTableBody");
const searchInput = document.getElementById("searchInput");
const pageMessage = document.getElementById("pageMessage");
const rowCount = document.getElementById("rowCount");
const footerSummary = document.getElementById("footerSummary");
const modal = document.getElementById("editModal");
const form = document.getElementById("editForm");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");
let rows = [];
let editingId = null;

const fields = {
  ncoInCharge: document.getElementById("ncoInCharge"),
  clerkInitials: document.getElementById("clerkInitials"),
  oic: document.getElementById("oic"),
  challanControlNumber: document.getElementById("challanControlNumber"),
  remarks: document.getElementById("remarks")
};

if (!token) window.location.replace("/pages/login.html");

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
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
function valueOrDash(value) {
  return value == null || String(value).trim() === "" ? "—" : value;
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
  return response;
}
async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}
async function errorText(response) {
  const body = await readJson(response);
  return body?.message || `Request failed (HTTP ${response.status}).`;
}

async function loadRegister() {
  clearMessage();
  tbody.innerHTML = `<tr><td colspan="17" class="table-state">Loading vehicle demand register…</td></tr>`;
  try {
    const response = await apiRequest(API_URL);
    if (!response) return;
    if (!response.ok) throw new Error(await errorText(response));
    rows = await response.json();
    renderRows();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="17" class="table-state">${escapeHtml(error.message || "Unable to load vehicle demand register.")}</td></tr>`;
    rowCount.textContent = "0";
    footerSummary.textContent = "Unable to load records.";
    showMessage(error.message || "Unable to load vehicle demand register.", "error");
  }
}

function renderRows() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(row =>
    [
      row.sNo, row.date, row.vehNo, row.typeOfVeh, row.nameOfUnit,
      row.from, row.to, row.driverName, row.licNo, row.mobNo,
      row.ncoInCharge, row.clk, row.oic, row.challanContNo,
      row.remarks, row.workflowStatus
    ].some(value => String(value ?? "").toLowerCase().includes(q))
  );
  rowCount.textContent = String(filtered.length);
  footerSummary.textContent = `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="17" class="table-state">No vehicle confirmation records found yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${escapeHtml(row.sNo)}</td>
      <td>${escapeHtml(displayDate(row.date))}</td>
      <td>${escapeHtml(valueOrDash(row.vehNo))}</td>
      <td>${escapeHtml(valueOrDash(row.typeOfVeh))}</td>
      <td>${escapeHtml(valueOrDash(row.nameOfUnit))}</td>
      <td>${escapeHtml(valueOrDash(row.from))}</td>
      <td>${escapeHtml(valueOrDash(row.to))}</td>
      <td>${escapeHtml(valueOrDash(row.driverName))}</td>
      <td>${escapeHtml(valueOrDash(row.licNo))}</td>
      <td>${escapeHtml(valueOrDash(row.mobNo))}</td>
      <td>${escapeHtml(valueOrDash(row.ncoInCharge))}</td>
      <td>${escapeHtml(valueOrDash(row.clk))}</td>
      <td>${escapeHtml(valueOrDash(row.oic))}</td>
      <td>${escapeHtml(valueOrDash(row.challanContNo))}</td>
      <td class="remarks-cell">${escapeHtml(valueOrDash(row.remarks))}</td>
      <td>${escapeHtml(valueOrDash(row.workflowStatus))}</td>
      <td><button type="button" class="edit-button" data-edit-row="${row.vehicleDemandConfirmationId}">Edit fields</button></td>
    </tr>
  `).join("");
}

function openEditor(id) {
  const row = rows.find(x => Number(x.vehicleDemandConfirmationId) === Number(id));
  if (!row) return;
  editingId = Number(id);
  document.getElementById("confirmationId").value = editingId;
  fields.ncoInCharge.value = row.ncoInCharge || "";
  fields.clerkInitials.value = row.clk || "";
  fields.oic.value = row.oic || "";
  fields.challanControlNumber.value = row.challanContNo || "";
  fields.remarks.value = row.remarks || "";
  formMessage.textContent = "";
  modal.hidden = false;
  fields.ncoInCharge.focus();
}
function closeEditor() {
  modal.hidden = true;
  editingId = null;
  formMessage.textContent = "";
}
async function saveRegisterFields() {
  if (editingId == null) return;
  formMessage.textContent = "";
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  const payload = {
    ncoInCharge: fields.ncoInCharge.value.trim(),
    clerkInitials: fields.clerkInitials.value.trim(),
    oic: fields.oic.value.trim(),
    challanControlNumber: fields.challanControlNumber.value.trim(),
    remarks: fields.remarks.value.trim()
  };
  try {
    const response = await apiRequest(`${API_URL}/${editingId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    if (!response) return;
    const body = await readJson(response);
    if (!response.ok) throw new Error(body?.message || `Save failed (HTTP ${response.status}).`);
    closeEditor();
    await loadRegister();
    showMessage(body?.message || "Vehicle demand register fields saved.");
  } catch (error) {
    formMessage.textContent = error.message || "Unable to save register fields.";
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save register fields";
  }
}

document.getElementById("refreshButton").addEventListener("click", loadRegister);
searchInput.addEventListener("input", renderRows);
tbody.addEventListener("click", event => {
  const button = event.target.closest("[data-edit-row]");
  if (button) openEditor(Number(button.dataset.editRow));
});
document.getElementById("closeModalButton").addEventListener("click", closeEditor);
document.getElementById("cancelButton").addEventListener("click", closeEditor);
modal.addEventListener("click", event => {
  if (event.target === modal) closeEditor();
});
form.addEventListener("submit", event => {
  event.preventDefault();
  saveRegisterFields();
});

loadRegister();
