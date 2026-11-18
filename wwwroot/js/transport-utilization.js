"use strict";

const TRANSPORT_UTILIZATION_API = "/api/transport-utilization";
const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";

const tableBody = document.getElementById("tableBody");
const recordSummary = document.getElementById("recordSummary");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const pageMessage = document.getElementById("pageMessage");
const modal = document.getElementById("utilizationModal");
const modalMessage = document.getElementById("modalMessage");
const form = document.getElementById("utilizationForm");
const saveButton = document.getElementById("saveButton");
const sidebar = document.querySelector(".sidebar");

let rows = [];
let selectedRow = null;
let saving = false;

if (!token) {
    window.location.replace("/pages/login.html");
} else {
    document.getElementById("headerUsername").textContent = username;
    document.getElementById("headerRole").textContent = role;
    document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();
    document.getElementById("menuButton").addEventListener("click", () => sidebar?.classList.toggle("open"));
    document.getElementById("refreshButton").addEventListener("click", loadRecords);
    document.getElementById("closeModalButton").addEventListener("click", closeModal);
    document.getElementById("cancelButton").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    form.addEventListener("submit", saveRecord);
    searchInput.addEventListener("input", renderTable);
    statusFilter.addEventListener("change", renderTable);
    tableBody.addEventListener("click", handleTableAction);
    loadRecords();
}

async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        sessionStorage.clear();
        window.location.replace("/pages/login.html");
        return null;
    }
    return response;
}

async function loadRecords() {
    renderLoading();
    clearPageMessage();
    try {
        const response = await apiRequest(TRANSPORT_UTILIZATION_API);
        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));
        rows = await response.json();
        if (!Array.isArray(rows)) rows = [];
        document.getElementById("awaitingCount").textContent = rows.filter(x => !x.hasTransportUtilization).length;
        document.getElementById("completedCount").textContent = rows.filter(x => x.hasTransportUtilization).length;
        document.getElementById("totalCount").textContent = rows.length;
        renderTable();
    } catch (error) {
        rows = [];
        tableBody.innerHTML = `<tr><td colspan="9" class="table-state">${escapeHtml(error.message || "Unable to load vehicle confirmations.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records";
        showPageMessage(error.message || "Unable to load Transport Utilization records.", "error");
    }
}

function renderLoading() {
    tableBody.innerHTML = '<tr><td colspan="9" class="table-state">Loading vehicle confirmations...</td></tr>';
    recordSummary.textContent = "Loading...";
}

function renderTable() {
    const q = searchInput.value.trim().toLowerCase();
    const filter = statusFilter.value;
    const filtered = rows.filter(row => {
        const complete = Boolean(row.hasTransportUtilization);
        if (filter === "pending" && complete) return false;
        if (filter === "completed" && !complete) return false;
        const haystack = [row.logReference, row.indentNumber, row.unitName, row.typeOfLoad,
            row.vehicleRegistrationNumber, row.driverName, row.assignedVendorName,
            row.fromLocation, row.destination].join(" ").toLowerCase();
        return haystack.includes(q);
    });

    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="9" class="table-state">No matching confirmed vehicles found.</td></tr>';
        recordSummary.textContent = "Showing 0 records";
        return;
    }

    tableBody.innerHTML = filtered.map(row => {
        const journey = row.utilization
            ? `${escapeHtml(row.utilization.journeyFrom)} → ${escapeHtml(row.utilization.journeyTo)}`
            : `${escapeHtml(row.fromLocation || "—")} → ${escapeHtml(row.destination || "—")}`;
        const complete = Boolean(row.hasTransportUtilization);
        return `
            <tr>
                <td class="code-cell">${escapeHtml(row.logReference)}</td>
                <td>${escapeHtml(row.indentNumber || "—")}</td>
                <td>${escapeHtml(row.unitName || "—")}</td>
                <td>${escapeHtml(row.typeOfLoad || "—")}</td>
                <td class="code-cell">${escapeHtml(row.vehicleRegistrationNumber || "—")}</td>
                <td>${escapeHtml(row.driverName || "—")}</td>
                <td>${journey}</td>
                <td><span class="tu-status ${complete ? "complete" : "pending"}">${complete ? "Utilization recorded" : "Awaiting utilization"}</span></td>
                <td><button type="button" class="tu-action-button ${complete ? "" : "primary"}" data-action="${complete ? "edit" : "add"}" data-id="${row.vehicleDemandConfirmationId}">${complete ? "View / Edit" : "Complete Part II"}</button></td>
            </tr>`;
    }).join("");

    recordSummary.textContent = `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}

function handleTableAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const row = rows.find(x => Number(x.vehicleDemandConfirmationId) === id);
    if (!row) return;
    openModal(row);
}

function openModal(row) {
    selectedRow = row;
    form.reset();
    clearModalMessage();
    const record = row.utilization || {};
    document.getElementById("vehicleDemandConfirmationId").value = row.vehicleDemandConfirmationId;
    document.getElementById("vehicleRegistrationNumber").value = row.vehicleRegistrationNumber || "";
    document.getElementById("driverName").value = row.driverName || "";
    document.getElementById("driverRegistrationNumber").value = row.driverRegistrationNumber || "";

    document.getElementById("transportReceivedDateTime").value = toDateTimeLocal(record.transportReceivedDateTime);
    document.getElementById("transportReceivedNumber").value = record.transportReceivedNumber || "";
    document.getElementById("journeyFrom").value = record.journeyFrom || row.fromLocation || "";
    document.getElementById("journeyTo").value = record.journeyTo || row.destination || "";
    document.getElementById("storesPersonnelLoadedDetails").value = record.storesPersonnelLoadedDetails || "";
    document.getElementById("loadedTallySheetReference").value = record.loadedTallySheetReference || "";
    document.getElementById("rtVoucherReference").value = record.rtVoucherReference || "";
    document.getElementById("transportLeftDepotDateTime").value = toDateTimeLocal(record.transportLeftDepotDateTime);
    document.getElementById("utilizingUnitStation").value = record.utilizingUnitStation || "";
    document.getElementById("utilizingOfficerRankNameDesignation").value = record.utilizingOfficerRankNameDesignation || "";
    document.getElementById("utilizingOfficerDate").value = toDateInput(record.utilizingOfficerDate);
    document.getElementById("loadingSupervisedBy").value = record.loadingSupervisedBy || "";
    document.getElementById("driverSignatureObtained").checked = Boolean(record.driverSignatureObtained);

    document.getElementById("modalTitle").textContent = row.hasTransportUtilization ? "View / Edit Transport Utilization — Part II" : "Transport Utilization — Part II";
    saveButton.textContent = row.hasTransportUtilization ? "Update Transport Utilization" : "Save Transport Utilization";
    document.getElementById("sourceSummary").innerHTML = [
        ["Log / Indent", `${row.logReference} · ${row.indentNumber || "—"}`],
        ["Unit / Type of Load", `${row.unitName || "—"} · ${row.typeOfLoad || "—"}`],
        ["Vehicle / Type", `${row.vehicleRegistrationNumber || "—"} · ${row.vehicleType || "—"}`],
        ["Driver", row.driverName || "—"],
        ["Vendor", row.assignedVendorName || "—"],
        ["Demand confirmed", formatDate(row.confirmationDate)]
    ].map(([label, value]) => `<div class="tu-source-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("transportReceivedDateTime").focus();
}

function closeModal(force = false) {
    if (saving && !force) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    selectedRow = null;
    clearModalMessage();
}

async function saveRecord(event) {
    event.preventDefault();
    clearModalMessage();
    if (!selectedRow || saving) return;
    if (!form.reportValidity()) return;

    const received = document.getElementById("transportReceivedDateTime").value;
    const left = document.getElementById("transportLeftDepotDateTime").value;
    if (!received || !left) {
        showModalMessage("Enter both transport received and transport left depot date/time.", "error");
        return;
    }
    if (new Date(left) < new Date(received)) {
        showModalMessage("Transport Left Depot date/time cannot be earlier than Transport Received date/time.", "error");
        return;
    }
    if (!document.getElementById("driverSignatureObtained").checked) {
        showModalMessage("Confirm that the driver's signature has been obtained on the source form.", "error");
        return;
    }

    const payload = {
        transportReceivedDateTime: received,
        transportReceivedNumber: nullable("transportReceivedNumber"),
        journeyFrom: value("journeyFrom").trim(),
        journeyTo: value("journeyTo").trim(),
        storesPersonnelLoadedDetails: value("storesPersonnelLoadedDetails").trim(),
        loadedTallySheetReference: nullable("loadedTallySheetReference"),
        rtVoucherReference: nullable("rtVoucherReference"),
        transportLeftDepotDateTime: left,
        utilizingUnitStation: value("utilizingUnitStation").trim(),
        utilizingOfficerRankNameDesignation: value("utilizingOfficerRankNameDesignation").trim(),
        utilizingOfficerDate: value("utilizingOfficerDate"),
        loadingSupervisedBy: value("loadingSupervisedBy").trim(),
        driverSignatureObtained: true
    };

    setSaving(true);
    try {
        const isUpdate = Boolean(selectedRow.hasTransportUtilization);
        const url = `${TRANSPORT_UTILIZATION_API}/${selectedRow.vehicleDemandConfirmationId}`;
        const response = await apiRequest(url, {
            method: isUpdate ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const result = await response.json();
        closeModal(true);
        await loadRecords();
        showPageMessage(result.message || "Transport Utilization saved successfully.", "success");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        showModalMessage(error.message || "Unable to save Transport Utilization.", "error");
    } finally {
        setSaving(false);
    }
}

function value(id) { return document.getElementById(id).value; }
function nullable(id) { const v = value(id).trim(); return v === "" ? null : v; }
function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function toDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}
function renderLoading() {
    tableBody.innerHTML = '<tr><td colspan="9" class="table-state">Loading vehicle confirmations...</td></tr>';
    recordSummary.textContent = "Loading...";
}
async function getErrorMessage(response) {
    let data;
    try { data = await response.json(); } catch { return `Request failed (${response.status}).`; }
    if (data?.message) return data.message;
    if (data?.title) return data.title;
    if (data?.errors) return Object.values(data.errors).flat().join(" ");
    return `Request failed (${response.status}).`;
}
function showPageMessage(message, type) {
    pageMessage.textContent = message;
    pageMessage.className = `page-message ${type}`;
    pageMessage.hidden = false;
}
function clearPageMessage() { pageMessage.textContent = ""; pageMessage.hidden = true; pageMessage.className = "page-message"; }
function showModalMessage(message, type) {
    modalMessage.textContent = message;
    modalMessage.className = `page-message ${type}`;
    modalMessage.hidden = false;
}
function clearModalMessage() { modalMessage.textContent = ""; modalMessage.hidden = true; modalMessage.className = "page-message"; }
function setSaving(value) {
    saving = value;
    saveButton.disabled = value;
    saveButton.textContent = value ? "Saving..." : (selectedRow?.hasTransportUtilization ? "Update Transport Utilization" : "Save Transport Utilization");
}
function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}
