"use strict";

const INDENT_API = "/api/Indent";
const VEHICLE_API = "/api/Vehicle";
const LOCATION_API = "/api/Location";

const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";

const pageMessage = document.getElementById("pageMessage");
const indentForm = document.getElementById("indentForm");
const saveButton = document.getElementById("saveIndentButton");
const vehicleSelect = document.getElementById("vehicleId");
const locationSelect = document.getElementById("whereRequiredLocationId");
const tableBody = document.getElementById("indentTableBody");
const recordSummary = document.getElementById("indentRecordSummary");
const sidebar = document.querySelector(".sidebar");

 document.getElementById("headerUsername").textContent = username;
 document.getElementById("headerRole").textContent = role;
 document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

if (!token) {
    window.location.replace("/pages/login.html");
} else {
    initializePage();
}

async function initializePage() {
    document.getElementById("menuButton").addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.getElementById("refreshIndentsButton").addEventListener("click", loadIndents);

    indentForm.addEventListener("submit", submitIndent);
    indentForm.addEventListener("reset", () => {
        window.setTimeout(() => clearMessage(), 0);
    });

    await Promise.all([loadVehicles(), loadLocations()]);
    await loadIndents();
}

async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        sessionStorage.clear();
        window.location.replace("/pages/login.html");
        return null;
    }
    return response;
}

async function loadVehicles() {
    vehicleSelect.innerHTML = '<option value="">Loading vehicle types...</option>';
    try {
        const response = await apiRequest(VEHICLE_API);
        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const vehicles = await response.json();
        const activeVehicles = vehicles.filter(vehicle => vehicle.isActive);
        vehicleSelect.innerHTML = '<option value="">Select vehicle type</option>';

        for (const vehicle of activeVehicles) {
            const option = document.createElement("option");
            option.value = vehicle.vehicleId;
            option.textContent = `${vehicle.vehicleType} (${vehicle.vehicleCode})`;
            vehicleSelect.appendChild(option);
        }

        if (activeVehicles.length === 0) {
            showMessage("No active vehicle types found. Add/activate a vehicle type in Vehicle Master before registering an indent.", "warning");
        }
    } catch (error) {
        vehicleSelect.innerHTML = '<option value="">Unable to load vehicles</option>';
        showMessage(`Vehicle Master could not be loaded. ${error.message}`, "error");
    }
}

async function loadLocations() {
    locationSelect.innerHTML = '<option value="">Loading locations...</option>';
    try {
        const response = await apiRequest(LOCATION_API);
        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const locations = await response.json();
        const activeLocations = locations.filter(location => location.isActive);
        locationSelect.innerHTML = '<option value="">Select location</option>';

        for (const location of activeLocations) {
            const option = document.createElement("option");
            option.value = location.locationId;
            option.textContent = `${location.locationName} (${location.locationCode})`;
            locationSelect.appendChild(option);
        }

        if (activeLocations.length === 0) {
            showMessage("No active locations found. Add/activate a location in Location Master before registering an indent.", "warning");
        }
    } catch (error) {
        locationSelect.innerHTML = '<option value="">Unable to load locations</option>';
        showMessage(`Location Master could not be loaded. ${error.message}`, "error");
    }
}

async function submitIndent(event) {
    event.preventDefault();
    clearMessage();

    if (!indentForm.reportValidity()) return;

    const requiredDateTime = valueOf("requiredDateTime");
    const indentDate = valueOf("indentDate");
    const vehicleId = Number(valueOf("vehicleId"));
    const locationId = Number(valueOf("whereRequiredLocationId"));
    const vehicleQuantity = Number(valueOf("vehicleQuantity"));

    if (!vehicleId || !locationId || !Number.isInteger(vehicleQuantity) || vehicleQuantity < 1) {
        showMessage("Select an active vehicle type and location, and enter a vehicle quantity of at least 1.", "error");
        return;
    }

    if (!indentDate || !requiredDateTime) {
        showMessage("Enter both the indent date and the required date/time.", "error");
        return;
    }

    const payload = {
        unitName: valueOf("unitName").trim(),
        userDetails: valueOf("userDetails").trim(),
        indentNumber: valueOf("indentNumber").trim(),
        indentDate,
        requiredDateTime,
        vehicleQuantity,
        vehicleId,
        whereRequiredLocationId: locationId,
        durationOfEmployment: valueOf("durationOfEmployment").trim(),
        destination: nullableText("destination"),
        oneWayDistance: valueOf("oneWayDistance") === "" ? null : Number(valueOf("oneWayDistance")),
        viaRoute: nullableText("viaRoute"),
        exactNatureOfDutyWithAuthority: valueOf("exactNatureOfDutyWithAuthority").trim(),
        reasonRegimentalStandingDutyTransportNotUtilized: nullableText("reasonRegimentalStandingDutyTransportNotUtilized"),
        reasonForUsingCHTOnSundayHoliday: nullableText("reasonForUsingCHTOnSundayHoliday"),
        reasonForUsingCHTToRailConnectedDestination: nullableText("reasonForUsingCHTToRailConnectedDestination"),
        indentingOfficerStation: nullableText("indentingOfficerStation"),
        indentingOfficerDate: nullableDate("indentingOfficerDate"),
        certifyingOfficerStation: nullableText("certifyingOfficerStation"),
        certifyingOfficerDate: nullableDate("certifyingOfficerDate"),
        hiringTransportRegisterSerialNumber: nullableText("hiringTransportRegisterSerialNumber"),
        budgetHead: nullableText("budgetHead"),
        transportSupplyDateTime: nullableDateTime("transportSupplyDateTime"),
        detailsOfJourney: nullableText("detailsOfJourney"),
        durationOfDutyDaysHours: nullableText("durationOfDutyDaysHours"),
        orderStation: nullableText("orderStation"),
        orderDate: nullableDate("orderDate"),
        issuingOfficerRankNameDesignation: nullableText("issuingOfficerRankNameDesignation")
    };

    setSaving(true);
    try {
        const response = await apiRequest(INDENT_API, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const created = await response.json();

        indentForm.reset();
        document.getElementById("vehicleQuantity").value = "1";
        document.getElementById("budgetHead").value = "105F/1/255/01 & 02";
        await loadIndents();
        showMessage(`Indent log registered successfully. Log reference: ${created.indentId}. Status: ${created.status || "Pending with Clerk"}.`, "success");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        showMessage(error.message || "Unable to register the indent log.", "error");
    } finally {
        setSaving(false);
    }
}

async function loadIndents() {
    tableBody.innerHTML = '<tr><td colspan="7" class="table-state">Loading indent logs...</td></tr>';
    recordSummary.textContent = "Loading...";

    try {
        const response = await apiRequest(INDENT_API);
        if (!response) return;
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const indents = await response.json();
        if (!Array.isArray(indents) || indents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="table-state">No indent logs registered yet.</td></tr>';
            recordSummary.textContent = "Showing 0 records";
            return;
        }

        tableBody.innerHTML = indents.map(indent => `
            <tr>
                <td class="code-cell">${escapeHtml(indent.indentId)}</td>
                <td>${escapeHtml(indent.indentNumber || "—")}</td>
                <td>${escapeHtml(indent.unitName || "—")}</td>
                <td>${escapeHtml(formatDateTime(indent.requiredDateTime))}</td>
                <td>${escapeHtml(indent.vehicle?.vehicleType || "—")}${indent.vehicleQuantity ? ` × ${escapeHtml(indent.vehicleQuantity)}` : ""}</td>
                <td>${escapeHtml(indent.whereRequiredLocation?.locationName || "—")}</td>
                <td><span class="status-badge ${statusClass(indent.status)}">${escapeHtml(indent.status || "Unknown")}</span></td>
            </tr>
        `).join("");
        recordSummary.textContent = `Showing ${indents.length} record${indents.length === 1 ? "" : "s"}`;
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="7" class="table-state">${escapeHtml(error.message || "Unable to load indent logs.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records";
    }
}

function valueOf(id) {
    return document.getElementById(id).value;
}

function nullableText(id) {
    const value = valueOf(id).trim();
    return value === "" ? null : value;
}

function nullableDate(id) {
    const value = valueOf(id);
    return value === "" ? null : value;
}

function nullableDateTime(id) {
    const value = valueOf(id);
    return value === "" ? null : value;
}

async function getErrorMessage(response) {
    let data;
    try {
        data = await response.json();
    } catch {
        return `Request failed (${response.status}).`;
    }

    if (data?.message) return data.message;
    if (data?.title) return data.title;
    if (data?.errors && typeof data.errors === "object") {
        return Object.values(data.errors).flat().join(" ");
    }
    return `Request failed (${response.status}).`;
}

function showMessage(message, type) {
    pageMessage.textContent = message;
    pageMessage.className = `page-message ${type}`;
    pageMessage.hidden = false;
}

function clearMessage() {
    pageMessage.textContent = "";
    pageMessage.hidden = true;
    pageMessage.className = "page-message";
}

function setSaving(isSaving) {
    saveButton.disabled = isSaving;
    saveButton.textContent = isSaving ? "Registering..." : "Register Indent Log";
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function statusClass(status) {
    const normalised = String(status || "").toLowerCase();
    if (normalised.includes("approved")) return "active";
    if (normalised.includes("pending")) return "pending";
    return "inactive";
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}
