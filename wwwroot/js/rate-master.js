"use strict";

const API_URL = "/api/Rate";
const token = sessionStorage.getItem("token");
if (!token) window.location.replace("/pages/login.html");

const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";
document.getElementById("headerUsername").textContent = username;
document.getElementById("headerRole").textContent = role;
document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

const categories = ["Water Truck", "5/6 Ton", "9 Ton", "FBT", "BPL", "Hydra", "1.5 Ton", "Dozer", "26 SB", "37 SB", "Lt Vehs - A", "Lt Vehs - B", "JCB", "Rec Vehs"];
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const recordSummary = document.getElementById("recordSummary");
const pageMessage = document.getElementById("pageMessage");
const modal = document.getElementById("editModal");
const form = document.getElementById("editForm");
const modalTitle = document.getElementById("modalTitle");
const rateId = document.getElementById("rateId");
const contractYear = document.getElementById("contractYear");
const vehicleCategory = document.getElementById("vehicleCategory");
const serialNo = document.getElementById("serialNo");
const itemTitle = document.getElementById("itemTitle");
const unitOfMeasure = document.getElementById("unitOfMeasure");
const rateAmount = document.getElementById("rateAmount");
const isActive = document.getElementById("isActive");
const statusText = document.getElementById("statusText");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");
let rates = [];
let editingId = null;

function fillCategorySelect(select, includeAll = false) {
    select.innerHTML = includeAll ? '<option value="">All vehicle categories</option>' : '<option value="">Select vehicle category</option>';
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
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

async function responseMessage(response) {
    try {
        const data = await response.json();
        if (data?.message) return data.message;
        if (data?.errors) return Object.values(data.errors).flat().join(" ");
    } catch { /* use fallback below */ }
    return `Request failed (HTTP ${response.status}).`;
}

function showPageMessage(message, type = "success") {
    pageMessage.textContent = message;
    pageMessage.className = `rv-message ${type}`;
}
function clearPageMessage() { pageMessage.textContent = ""; pageMessage.className = "rv-message"; }
function showFormMessage(message) { formMessage.textContent = message; }
function clearFormMessage() { formMessage.textContent = ""; }
function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}
function formatRate(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

async function loadRates() {
    tableBody.innerHTML = '<tr><td colspan="9" class="table-state">Loading rate records...</td></tr>';
    recordSummary.textContent = "Loading...";
    clearPageMessage();
    try {
        const response = await apiRequest(API_URL);
        if (!response) return;
        if (!response.ok) throw new Error(await responseMessage(response));
        rates = await response.json();
        renderTable();
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="9" class="table-state">${escapeHtml(error.message || "Unable to load rates.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records.";
        showPageMessage(error.message || "Unable to load rates.", "error");
    }
}

function renderTable() {
    const term = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const filtered = rates.filter(item => {
        const haystack = [item.contractYear, item.vehicleCategory, item.serialNo, item.itemTitle, item.unitOfMeasure, item.rateAmount, item.isActive ? "active" : "inactive"].join(" ").toLowerCase();
        return (!term || haystack.includes(term)) && (!category || item.vehicleCategory === category);
    });
    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="9" class="table-state">No rate records found. You can add a record or load the PDF rates using the supplied SQL seed script.</td></tr>';
    } else {
        tableBody.innerHTML = filtered.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.contractYear)}</td>
                <td>${escapeHtml(item.vehicleCategory)}</td>
                <td>${escapeHtml(item.serialNo)}</td>
                <td>${escapeHtml(item.itemTitle)}</td>
                <td>${escapeHtml(item.unitOfMeasure)}</td>
                <td class="rate-number">${formatRate(item.rateAmount)}</td>
                <td><span class="rv-badge ${item.isActive ? "active" : "inactive"}">${item.isActive ? "Active" : "Inactive"}</span></td>
                <td><button type="button" class="rv-action-button" data-action="edit" data-id="${item.rateId}">Edit</button></td>
            </tr>`).join("");
    }
    recordSummary.textContent = `Showing ${filtered.length} of ${rates.length} record${rates.length === 1 ? "" : "s"}`;
}

function openAddModal() {
    editingId = null;
    form.reset();
    rateId.value = "";
    contractYear.value = "2026-27";
    fillCategorySelect(vehicleCategory, false);
    isActive.checked = true;
    statusText.textContent = "Active";
    modalTitle.textContent = "Add Contract Rate";
    saveButton.textContent = "Save Rate";
    clearFormMessage();
    modal.hidden = false;
    contractYear.focus();
}

function openEditModal(id) {
    const item = rates.find(rate => rate.rateId === id);
    if (!item) return;
    editingId = id;
    form.reset();
    rateId.value = item.rateId;
    contractYear.value = item.contractYear || "2026-27";
    fillCategorySelect(vehicleCategory, false);
    if (!categories.includes(item.vehicleCategory)) {
        const option = document.createElement("option");
        option.value = item.vehicleCategory;
        option.textContent = item.vehicleCategory;
        vehicleCategory.appendChild(option);
    }
    vehicleCategory.value = item.vehicleCategory;
    serialNo.value = item.serialNo;
    itemTitle.value = item.itemTitle || "";
    unitOfMeasure.value = item.unitOfMeasure || "";
    rateAmount.value = formatRate(item.rateAmount);
    isActive.checked = Boolean(item.isActive);
    statusText.textContent = isActive.checked ? "Active" : "Inactive";
    modalTitle.textContent = "Edit Contract Rate";
    saveButton.textContent = "Update Rate";
    clearFormMessage();
    modal.hidden = false;
}

function closeModal() { modal.hidden = true; editingId = null; clearFormMessage(); }

async function saveRate() {
    clearFormMessage();
    const year = contractYear.value.trim();
    const category = vehicleCategory.value;
    const serial = Number(serialNo.value);
    const item = itemTitle.value.trim();
    const unit = unitOfMeasure.value.trim();
    const amount = Number(rateAmount.value);
    if (!year || !category || !Number.isInteger(serial) || serial < 1 || !item || !unit || rateAmount.value === "" || !Number.isFinite(amount) || amount < 0) {
        showFormMessage("Complete all required fields. Serial number must be a positive whole number and rate must be zero or greater.");
        return;
    }
    const payload = { contractYear: year, vehicleCategory: category, serialNo: serial, itemTitle: item, unitOfMeasure: unit, rateAmount: amount, isActive: isActive.checked };
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    try {
        const response = await apiRequest(editingId === null ? API_URL : `${API_URL}/${editingId}`, {
            method: editingId === null ? "POST" : "PUT",
            body: JSON.stringify(payload)
        });
        if (!response) return;
        if (!response.ok) throw new Error(await responseMessage(response));
        const wasAdd = editingId === null;
        closeModal();
        await loadRates();
        showPageMessage(wasAdd ? "Rate saved successfully." : "Rate updated successfully.");
    } catch (error) {
        console.error(error);
        showFormMessage(error.message || "Unable to save rate.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId === null ? "Save Rate" : "Update Rate";
    }
}

function logout() {
    sessionStorage.clear();
    window.location.replace("/pages/login.html");
}

fillCategorySelect(vehicleCategory, false);
fillCategorySelect(categoryFilter, true);
document.getElementById("addButton").addEventListener("click", openAddModal);
document.getElementById("closeModalButton").addEventListener("click", closeModal);
document.getElementById("cancelButton").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
form.addEventListener("submit", event => { event.preventDefault(); saveRate(); });
isActive.addEventListener("change", () => { statusText.textContent = isActive.checked ? "Active" : "Inactive"; });
searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);
tableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-action='edit']");
    if (button) openEditModal(Number(button.dataset.id));
});
document.getElementById("menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.getElementById("logoutButton").addEventListener("click", logout);
loadRates();
