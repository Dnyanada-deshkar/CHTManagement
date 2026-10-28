"use strict";

const VEHICLE_DEMAND_API = "/api/vehicle-demand-confirmation";
const token = sessionStorage.getItem("token");

if (!token) window.location.replace("/pages/login.html");

const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";
document.getElementById("headerUsername").textContent = username;
document.getElementById("headerRole").textContent = role;
document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

const tableBody = document.getElementById("demandTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshButton = document.getElementById("refreshButton");
const pageMessage = document.getElementById("pageMessage");
const recordSummary = document.getElementById("recordSummary");
const awaitingCount = document.getElementById("awaitingCount");
const completedCount = document.getElementById("completedCount");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

const confirmationModal = document.getElementById("confirmationModal");
const confirmationForm = document.getElementById("confirmationForm");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveConfirmation");
const dateInput = document.getElementById("confirmationDate");
const vehicleNumberInput = document.getElementById("vehicleNumber");
const driverNameInput = document.getElementById("driverName");
const licenseNumberInput = document.getElementById("licenseNumber");
const mobileNumberInput = document.getElementById("mobileNumber");
const vehiclePhotoInput = document.getElementById("vehiclePhoto");
const photoPreviewWrap = document.getElementById("photoPreviewWrap");
const photoPreview = document.getElementById("photoPreview");
const photoPreviewName = document.getElementById("photoPreviewName");

const detailsModal = document.getElementById("detailsModal");
const detailsContent = document.getElementById("confirmationDetailsContent");
const detailsSubtitle = document.getElementById("detailsModalSubtitle");
const photoModal = document.getElementById("photoModal");
const vehiclePhotoViewer = document.getElementById("vehiclePhotoViewer");
const photoModalTitle = document.getElementById("photoModalTitle");
const photoModalSubtitle = document.getElementById("photoModalSubtitle");
const photoViewMessage = document.getElementById("photoViewMessage");

let indentLogs = [];
let currentIndent = null;
let isLoading = false;
let previewObjectUrl = null;
let viewedPhotoObjectUrl = null;

async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        sessionStorage.clear();
        window.location.replace("/pages/login.html");
        return null;
    }
    return response;
}

async function readResponse(response) {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); }
    catch { return { message: text }; }
}

function messageFrom(data, fallback) {
    if (!data) return fallback;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (data.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat().find(value => typeof value === "string");
        if (first) return first;
    }
    if (typeof data.title === "string") return data.title;
    return fallback;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
}

function showPageMessage(message, type) {
    pageMessage.textContent = message;
    pageMessage.className = `vdc-message ${type}`;
    pageMessage.hidden = false;
}
function clearPageMessage() { pageMessage.textContent = ""; pageMessage.className = "vdc-message"; pageMessage.hidden = true; }
function showFormMessage(message) { formMessage.textContent = message || ""; }
function clearFormMessage() { formMessage.textContent = ""; }

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function requestedQuantity(item) {
    const n = Number(item.requestedQuantity);
    return Number.isInteger(n) && n > 0 ? n : 0;
}
function confirmedQuantity(item) {
    return Array.isArray(item.confirmations) ? item.confirmations.length : Number(item.confirmedVehicleCount || 0);
}
function isComplete(item) {
    return item.status === "Vehicle Demand Confirmed";
}
function canAddConfirmation(item) {
    return item.status === "Assigned to Vendor" && requestedQuantity(item) > confirmedQuantity(item);
}
function latestConfirmationDate(item) {
    const confirmations = Array.isArray(item.confirmations) ? item.confirmations : [];
    if (!confirmations.length) return null;
    return confirmations.reduce((latest, current) => {
        const a = new Date(latest.confirmedAt || latest.confirmationDate || 0).getTime();
        const b = new Date(current.confirmedAt || current.confirmationDate || 0).getTime();
        return b > a ? current : latest;
    }).confirmationDate;
}

function renderLoading() {
    tableBody.innerHTML = '<tr><td colspan="11" class="table-state">Loading vendor-assigned indent logs...</td></tr>';
    recordSummary.textContent = "Loading...";
}

function renderRows() {
    const term = searchInput.value.trim().toLowerCase();
    const selected = statusFilter.value;
    const filtered = indentLogs.filter(item => {
        const complete = isComplete(item);
        if (selected === "pending" && complete) return false;
        if (selected === "complete" && !complete) return false;
        const fields = [item.logReference, item.indentNumber, item.unitName, item.fromLocation, item.destination,
            item.vehicleType, item.assignedVendorCode, item.assignedVendorName, item.status,
            ...(item.confirmations || []).flatMap(c => [c.vehicleNumber, c.driverName])];
        return !term || fields.some(value => String(value ?? "").toLowerCase().includes(term));
    });

    if (!filtered.length) {
        const emptyText = indentLogs.length === 0
            ? "No vendor-assigned indent logs found. Complete Vendor Assignment first."
            : "No records match the selected search or filter.";
        tableBody.innerHTML = `<tr><td colspan="11" class="table-state">${escapeHtml(emptyText)}</td></tr>`;
        recordSummary.textContent = "Showing 0 records";
        return;
    }

    tableBody.innerHTML = filtered.map(item => {
        const complete = isComplete(item);
        const required = requestedQuantity(item);
        const confirmed = confirmedQuantity(item);
        const lastDate = latestConfirmationDate(item);
        const vehicleLabel = [item.vehicleType || "Not specified", required ? `× ${required}` : ""].filter(Boolean).join(" ");
        const vendorCell = `<div class="vdc-vendor"><strong>${escapeHtml(item.assignedVendorName || "Vendor not available")}</strong><span>${escapeHtml(item.assignedVendorCode || "")}</span></div>`;
        const status = complete ? "Vehicle Demand Confirmed" : "Assigned to Vendor";
        let action = "";
        if (canAddConfirmation(item)) {
            action = `<button type="button" class="vdc-button primary" data-action="add" data-id="${Number(item.indentId)}">Add vehicle details</button>`;
        } else if (confirmed > 0) {
            action = `<button type="button" class="vdc-button secondary" data-action="view" data-id="${Number(item.indentId)}">View confirmations</button>`;
        } else {
            action = '<span class="vdc-muted">Check indent quantity</span>';
        }
        return `<tr>
            <td>${escapeHtml(formatDate(lastDate))}</td>
            <td class="vdc-ref">${escapeHtml(item.logReference ?? item.indentId)}</td>
            <td class="vdc-indent-number">${escapeHtml(item.indentNumber || "—")}</td>
            <td>${escapeHtml(item.unitName || "—")}</td>
            <td>${escapeHtml(item.fromLocation || "—")}</td>
            <td>${escapeHtml(item.destination || "—")}</td>
            <td>${escapeHtml(vehicleLabel)}</td>
            <td>${vendorCell}</td>
            <td><div class="vdc-progress"><strong>${confirmed} / ${required || "?"}</strong><span>vehicles confirmed</span></div></td>
            <td><span class="vdc-status ${complete ? "complete" : "waiting"}">${escapeHtml(status)}</span></td>
            <td>${action}</td>
        </tr>`;
    }).join("");

    recordSummary.textContent = `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}

async function loadData() {
    if (!token || isLoading) return;
    isLoading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = "Loading...";
    renderLoading();
    clearPageMessage();
    try {
        const response = await apiRequest(VEHICLE_DEMAND_API);
        if (!response) return;
        const data = await readResponse(response);
        if (!response.ok) throw new Error(messageFrom(data, `Could not load vehicle demand records (HTTP ${response.status}).`));
        indentLogs = Array.isArray(data) ? data : [];
        awaitingCount.textContent = indentLogs.filter(item => !isComplete(item)).length;
        completedCount.textContent = indentLogs.filter(isComplete).length;
        renderRows();
    } catch (error) {
        console.error("Vehicle Demand Confirmation load error:", error);
        tableBody.innerHTML = `<tr><td colspan="11" class="table-state">Unable to load records. ${escapeHtml(error.message || "Please try again.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records";
        showPageMessage(error.message || "Unable to load Vehicle Demand Confirmation data.", "error");
    } finally {
        isLoading = false;
        refreshButton.disabled = false;
        refreshButton.innerHTML = '<span class="button-plus">↻</span> Refresh list';
    }
}

function openConfirmationModal(indent) {
    currentIndent = indent;
    confirmationForm.reset();
    clearFormMessage();
    dateInput.value = getLocalDateString(new Date());
    document.getElementById("modalIndentSummary").textContent = `${indent.indentNumber || "Indent"} · Log reference ${indent.logReference ?? indent.indentId}`;
    document.getElementById("contextUnit").textContent = indent.unitName || "—";
    document.getElementById("contextFrom").textContent = indent.fromLocation || "—";
    document.getElementById("contextTo").textContent = indent.destination || "—";
    document.getElementById("contextVehicleType").textContent = indent.vehicleType || "—";
    document.getElementById("contextVendor").textContent = indent.assignedVendorName || "—";
    document.getElementById("contextCount").textContent = `${confirmedQuantity(indent)} of ${requestedQuantity(indent)} vehicles recorded`;
    hidePhotoPreview();
    confirmationModal.hidden = false;
    vehicleNumberInput.focus();
}

function closeConfirmationModal() {
    confirmationModal.hidden = true;
    currentIndent = null;
    clearFormMessage();
    hidePhotoPreview();
}

function getLocalDateString(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function hidePhotoPreview() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
    photoPreview.src = "";
    photoPreviewWrap.hidden = true;
    photoPreviewName.textContent = "";
}

function showPhotoPreview(file) {
    hidePhotoPreview();
    if (!file) return;
    previewObjectUrl = URL.createObjectURL(file);
    photoPreview.src = previewObjectUrl;
    photoPreviewName.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    photoPreviewWrap.hidden = false;
}

async function submitConfirmation(event) {
    event.preventDefault();
    clearFormMessage();
    if (!currentIndent) { showFormMessage("Select an indent log again and retry."); return; }
    const file = vehiclePhotoInput.files?.[0];
    if (!file) { showFormMessage("Choose a vehicle photo before saving."); vehiclePhotoInput.focus(); return; }
    if (file.size > 5 * 1024 * 1024) { showFormMessage("Vehicle photo must be 5 MB or smaller."); vehiclePhotoInput.focus(); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (file.type && !allowedTypes.includes(file.type)) { showFormMessage("Use a JPEG, PNG or WebP image."); vehiclePhotoInput.focus(); return; }

    const body = new FormData();
    body.append("ConfirmationDate", dateInput.value);
    body.append("VehicleNumber", vehicleNumberInput.value.trim());
    body.append("DriverName", driverNameInput.value.trim());
    body.append("LicenseNumber", licenseNumberInput.value.trim());
    body.append("MobileNumber", mobileNumberInput.value.trim());
    body.append("VehiclePhoto", file);

    saveButton.disabled = true;
    saveButton.textContent = "Saving confirmation...";
    try {
        const response = await apiRequest(`${VEHICLE_DEMAND_API}/${currentIndent.indentId}`, { method: "POST", body });
        if (!response) return;
        const data = await readResponse(response);
        if (!response.ok) throw new Error(messageFrom(data, `Vehicle confirmation failed (HTTP ${response.status}).`));
        const message = data?.message || "Vehicle details confirmed successfully.";
        closeConfirmationModal();
        await loadData();
        showPageMessage(message, "success");
    } catch (error) {
        console.error("Vehicle confirmation save error:", error);
        showFormMessage(error.message || "Unable to save vehicle confirmation.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save vehicle confirmation";
    }
}

function openDetailsModal(indent) {
    detailsContent.innerHTML = "";
    detailsSubtitle.textContent = `${indent.indentNumber || "Indent"} · ${confirmedQuantity(indent)} of ${requestedQuantity(indent)} vehicles recorded`;
    const confirmations = Array.isArray(indent.confirmations) ? indent.confirmations : [];
    if (!confirmations.length) {
        detailsContent.innerHTML = '<p class="vdc-muted">No vehicle confirmations are recorded for this indent yet.</p>';
    } else {
        detailsContent.innerHTML = confirmations.map(item => `
            <article class="vdc-confirmation-card">
                <div>
                    <strong>${escapeHtml(item.vehicleNumber || "Vehicle number unavailable")}</strong>
                    <span>Date: ${escapeHtml(formatDate(item.confirmationDate))}</span>
                    <span>Driver: ${escapeHtml(item.driverName || "—")}</span>
                </div>
                <div>
                    <span>Licence No: ${escapeHtml(item.licenseNumber || "—")}</span>
                    <span>Mobile No: ${escapeHtml(item.mobileNumber || "—")}</span>
                    <span>Confirmed by: ${escapeHtml(item.confirmedBy || "—")}</span>
                </div>
                <div><button type="button" class="vdc-button secondary" data-action="photo" data-photo-url="${escapeHtml(item.photoUrl || "")}" data-vehicle="${escapeHtml(item.vehicleNumber || "Vehicle photo")}">View vehicle photo</button></div>
            </article>`).join("");
    }
    detailsModal.hidden = false;
}

async function openPhotoViewer(url, vehicleNumber) {
    if (!url) { showPageMessage("Photo URL is unavailable for this confirmation.", "error"); return; }
    photoModalTitle.textContent = "Vehicle photo";
    photoModalSubtitle.textContent = vehicleNumber || "Confirmed vehicle";
    photoViewMessage.textContent = "Loading photo...";
    photoModal.hidden = false;
    vehiclePhotoViewer.hidden = true;
    vehiclePhotoViewer.removeAttribute("src");
    if (viewedPhotoObjectUrl) URL.revokeObjectURL(viewedPhotoObjectUrl);
    viewedPhotoObjectUrl = null;
    try {
        const response = await apiRequest(url);
        if (!response) return;
        if (!response.ok) {
            const data = await readResponse(response);
            throw new Error(messageFrom(data, `Could not load photo (HTTP ${response.status}).`));
        }
        const blob = await response.blob();
        viewedPhotoObjectUrl = URL.createObjectURL(blob);
        vehiclePhotoViewer.src = viewedPhotoObjectUrl;
        vehiclePhotoViewer.hidden = false;
        photoViewMessage.textContent = "";
    } catch (error) {
        photoViewMessage.textContent = error.message || "Could not load photo.";
    }
}

function closePhotoViewer() {
    photoModal.hidden = true;
    vehiclePhotoViewer.hidden = true;
    vehiclePhotoViewer.removeAttribute("src");
    photoViewMessage.textContent = "";
    if (viewedPhotoObjectUrl) URL.revokeObjectURL(viewedPhotoObjectUrl);
    viewedPhotoObjectUrl = null;
}

refreshButton.addEventListener("click", loadData);
searchInput.addEventListener("input", renderRows);
statusFilter.addEventListener("change", renderRows);

tableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const indent = indentLogs.find(item => Number(item.indentId) === Number(button.dataset.id));
    if (!indent) { showPageMessage("Indent log is no longer available. Refresh the list.", "error"); return; }
    if (button.dataset.action === "add") {
        if (!canAddConfirmation(indent)) { showPageMessage("This indent is not currently eligible for another vehicle confirmation.", "error"); return; }
        openConfirmationModal(indent);
    } else if (button.dataset.action === "view") {
        openDetailsModal(indent);
    }
});

confirmationForm.addEventListener("submit", submitConfirmation);
vehiclePhotoInput.addEventListener("change", () => showPhotoPreview(vehiclePhotoInput.files?.[0] || null));

document.getElementById("closeConfirmationModal").addEventListener("click", closeConfirmationModal);
document.getElementById("cancelConfirmation").addEventListener("click", closeConfirmationModal);
confirmationModal.addEventListener("click", event => { if (event.target === confirmationModal) closeConfirmationModal(); });
document.getElementById("closeDetailsModal").addEventListener("click", () => { detailsModal.hidden = true; });
document.getElementById("closeDetailsFooter").addEventListener("click", () => { detailsModal.hidden = true; });
detailsModal.addEventListener("click", event => { if (event.target === detailsModal) detailsModal.hidden = true; });
detailsContent.addEventListener("click", event => {
    const button = event.target.closest('[data-action="photo"]');
    if (button) openPhotoViewer(button.dataset.photoUrl, button.dataset.vehicle);
});
document.getElementById("closePhotoModal").addEventListener("click", closePhotoViewer);
photoModal.addEventListener("click", event => { if (event.target === photoModal) closePhotoViewer(); });

menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!photoModal.hidden) closePhotoViewer();
        else if (!detailsModal.hidden) detailsModal.hidden = true;
        else if (!confirmationModal.hidden) closeConfirmationModal();
    }
});

loadData();
