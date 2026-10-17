"use strict";

const ASSIGNMENT_API = "/api/vendor-assignment";
const VENDOR_API = "/api/Vendor";
const token = sessionStorage.getItem("token");

if (!token) {
    window.location.replace("/pages/login.html");
}

const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";

document.getElementById("headerUsername").textContent = username;
document.getElementById("headerRole").textContent = role;
document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

const tableBody = document.getElementById("assignmentTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshButton = document.getElementById("refreshButton");
const pageMessage = document.getElementById("pageMessage");
const recordSummary = document.getElementById("recordSummary");
const vendorSummary = document.getElementById("vendorSummary");
const pendingCount = document.getElementById("pendingCount");
const assignedCount = document.getElementById("assignedCount");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

let indentLogs = [];
let activeVendors = [];
let isLoading = false;

async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined && !headers["Content-Type"]) {
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
        const first = Object.values(data.errors).flat().find(x => typeof x === "string");
        if (first) return first;
    }
    if (typeof data.title === "string") return data.title;
    return fallback;
}

function showMessage(message, type) {
    pageMessage.textContent = message;
    pageMessage.className = `va-message ${type}`;
    pageMessage.hidden = false;
}

function clearMessage() {
    pageMessage.textContent = "";
    pageMessage.className = "va-message";
    pageMessage.hidden = true;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(date);
}

function isAwaitingAssignment(item) {
    return item.status === "Approved by CIO" && !item.assignedVendorId;
}

function vendorDropdown(item) {
    if (activeVendors.length === 0) {
        return `<span class="va-empty-action">No active vendors. Add one in Vendor Master first.</span>`;
    }

    const options = activeVendors.map(vendor =>
        `<option value="${vendor.vendorId}">${escapeHtml(vendor.vendorCode)} — ${escapeHtml(vendor.vendorName)}</option>`
    ).join("");

    return `<select class="va-vendor-select" data-role="vendor-select" aria-label="Select vendor for indent ${item.indentId}">
        <option value="">Select vendor</option>${options}
    </select>`;
}

function renderRows() {
    const term = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filtered = indentLogs.filter(item => {
        const awaiting = isAwaitingAssignment(item);
        if (selectedStatus === "pending" && !awaiting) return false;
        if (selectedStatus === "assigned" && awaiting) return false;
        const searchFields = [
            item.logReference, item.indentNumber, item.unitName,
            item.vehicleType, item.locationName, item.destination,
            item.assignedVendorCode, item.assignedVendorName
        ].map(value => String(value ?? "").toLowerCase());
        return !term || searchFields.some(value => value.includes(term));
    });

    if (filtered.length === 0) {
        const isEmptySystem = indentLogs.length === 0;
        const text = isEmptySystem
            ? "No CIO-approved or assigned indent logs found. Approve an indent from the CIO Approval page first."
            : "No records match the selected search or filter.";
        tableBody.innerHTML = `<tr><td colspan="10" class="table-state">${escapeHtml(text)}</td></tr>`;
        recordSummary.textContent = "Showing 0 records";
        return;
    }

    tableBody.innerHTML = filtered.map(item => {
        const awaiting = isAwaitingAssignment(item);
        const vendorCell = awaiting
            ? vendorDropdown(item)
            : `<div class="va-assigned-vendor"><strong>${escapeHtml(item.assignedVendorName || "Vendor link unavailable")}</strong><span>${escapeHtml(item.assignedVendorCode || "")}${item.assignedAt ? ` · ${escapeHtml(formatDateTime(item.assignedAt))}` : ""}</span></div>`;
        const actionCell = awaiting
            ? `<button type="button" class="va-assign-button" data-action="assign" data-id="${item.indentId}">Assign vendor</button>`
            : `<span class="va-status assigned">Assigned</span>`;
        const statusClass = awaiting ? "pending" : "assigned";
        const vehicleLabel = [item.vehicleType || "Vehicle not specified", item.vehicleQuantity ? `× ${item.vehicleQuantity}` : ""].filter(Boolean).join(" ");

        return `<tr data-indent-id="${item.indentId}">
            <td>${escapeHtml(item.logReference ?? item.indentId)}</td>
            <td class="va-indent-number">${escapeHtml(item.indentNumber || "—")}</td>
            <td>${escapeHtml(item.unitName || "—")}</td>
            <td>${escapeHtml(formatDateTime(item.requiredDateTime))}</td>
            <td>${escapeHtml(vehicleLabel)}</td>
            <td>${escapeHtml(item.locationName || "—")}</td>
            <td>${escapeHtml(item.destination || "—")}</td>
            <td>${vendorCell}</td>
            <td><span class="va-status ${statusClass}">${escapeHtml(item.status || "—")}</span></td>
            <td>${actionCell}</td>
        </tr>`;
    }).join("");

    recordSummary.textContent = `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}

function renderLoading() {
    tableBody.innerHTML = `<tr><td colspan="10" class="table-state">Loading indent logs...</td></tr>`;
    recordSummary.textContent = "Loading...";
}

async function loadData() {
    if (!token || isLoading) return;
    isLoading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = "Loading...";
    renderLoading();
    clearMessage();

    try {
        const [indentResponse, vendorResponse] = await Promise.all([
            apiRequest(ASSIGNMENT_API),
            apiRequest(VENDOR_API)
        ]);
        if (!indentResponse || !vendorResponse) return;

        const indentData = await readResponse(indentResponse);
        if (!indentResponse.ok) {
            throw new Error(messageFrom(indentData, `Could not load assignment records (HTTP ${indentResponse.status}).`));
        }

        const vendorData = await readResponse(vendorResponse);
        if (!vendorResponse.ok) {
            throw new Error(messageFrom(vendorData, `Could not load vendors (HTTP ${vendorResponse.status}).`));
        }

        indentLogs = Array.isArray(indentData) ? indentData : [];
        activeVendors = (Array.isArray(vendorData) ? vendorData : [])
            .filter(vendor => vendor.isActive === true)
            .sort((a, b) => String(a.vendorName || "").localeCompare(String(b.vendorName || "")));

        pendingCount.textContent = indentLogs.filter(isAwaitingAssignment).length;
        assignedCount.textContent = indentLogs.filter(item => !isAwaitingAssignment(item)).length;
        vendorSummary.textContent = activeVendors.length === 0
            ? "No active vendors available"
            : `${activeVendors.length} active vendor${activeVendors.length === 1 ? "" : "s"} available`;

        renderRows();
    } catch (error) {
        console.error("Vendor Assignment load error:", error);
        tableBody.innerHTML = `<tr><td colspan="10" class="table-state">Unable to load records. ${escapeHtml(error.message || "Please try again.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records";
        showMessage(error.message || "Unable to load Vendor Assignment data.", "error");
    } finally {
        isLoading = false;
        refreshButton.disabled = false;
        refreshButton.innerHTML = '<span class="button-plus">↻</span> Refresh list';
    }
}

async function assignVendor(indentId, button, select) {
    clearMessage();
    const vendorId = Number(select?.value || 0);
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
        showMessage("Select an active vendor before assigning this indent log.", "error");
        select?.focus();
        return;
    }

    const indent = indentLogs.find(item => Number(item.indentId) === Number(indentId));
    const vendor = activeVendors.find(item => Number(item.vendorId) === vendorId);
    if (!indent || !vendor) {
        showMessage("The selected indent log or vendor is no longer available. Refresh the list and try again.", "error");
        return;
    }

    const confirmation = `Assign ${vendor.vendorName} (${vendor.vendorCode}) to indent ${indent.indentNumber || indentId}?`;
    if (!window.confirm(confirmation)) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Assigning...";
    if (select) select.disabled = true;

    try {
        const response = await apiRequest(`${ASSIGNMENT_API}/${indentId}/assign`, {
            method: "POST",
            body: JSON.stringify({ vendorId })
        });
        if (!response) return;

        const data = await readResponse(response);
        if (!response.ok) {
            throw new Error(messageFrom(data, `Vendor assignment failed (HTTP ${response.status}).`));
        }

        await loadData();
        showMessage(data?.message || "Vendor assigned successfully.", "success");
    } catch (error) {
        console.error("Vendor Assignment save error:", error);
        showMessage(error.message || "Unable to assign vendor. Please try again.", "error");
        button.disabled = false;
        button.textContent = originalText;
        if (select) select.disabled = false;
    }
}

refreshButton.addEventListener("click", loadData);
searchInput.addEventListener("input", renderRows);
statusFilter.addEventListener("change", renderRows);
tableBody.addEventListener("click", event => {
    const button = event.target.closest('button[data-action="assign"]');
    if (!button) return;
    const row = button.closest("tr");
    const indentId = Number(button.dataset.id);
    const select = row?.querySelector('[data-role="vendor-select"]');
    assignVendor(indentId, button, select);
});
if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
}

loadData();
