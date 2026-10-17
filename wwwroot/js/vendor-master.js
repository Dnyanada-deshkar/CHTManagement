"use strict";

const API_URL = "/api/Vendor";
const token = sessionStorage.getItem("token");
if (!token) window.location.replace("/pages/login.html");

const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "-";
document.getElementById("headerUsername").textContent = username;
document.getElementById("headerRole").textContent = role;
document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const recordSummary = document.getElementById("recordSummary");
const pageMessage = document.getElementById("pageMessage");
const modal = document.getElementById("editModal");
const form = document.getElementById("editForm");
const modalTitle = document.getElementById("modalTitle");
const vendorCode = document.getElementById("vendorCode");
const vendorName = document.getElementById("vendorName");
const contactPerson = document.getElementById("contactPerson");
const contactNumber = document.getElementById("contactNumber");
const email = document.getElementById("email");
const address = document.getElementById("address");
const isActive = document.getElementById("isActive");
const statusText = document.getElementById("statusText");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");
let vendors = [];
let editingId = null;

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}), "Authorization": `Bearer ${token}` }
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
function showPageMessage(message, type = "success") { pageMessage.textContent = message; pageMessage.className = `rv-message ${type}`; }
function showFormMessage(message) { formMessage.textContent = message; }
function clearFormMessage() { formMessage.textContent = ""; }
function clearPageMessage() { pageMessage.textContent = ""; pageMessage.className = "rv-message"; }
function escapeHtml(value) { const element = document.createElement("span"); element.textContent = String(value ?? ""); return element.innerHTML; }

async function loadVendors() {
    tableBody.innerHTML = '<tr><td colspan="8" class="table-state">Loading vendors...</td></tr>';
    recordSummary.textContent = "Loading...";
    clearPageMessage();
    try {
        const response = await apiRequest(API_URL);
        if (!response) return;
        if (!response.ok) throw new Error(await responseMessage(response));
        vendors = await response.json();
        renderTable();
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="8" class="table-state">${escapeHtml(error.message || "Unable to load vendors.")}</td></tr>`;
        recordSummary.textContent = "Unable to load records.";
        showPageMessage(error.message || "Unable to load vendors.", "error");
    }
}

function renderTable() {
    const term = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const filtered = vendors.filter(item => {
        const haystack = [item.vendorCode, item.vendorName, item.contactPerson, item.contactNumber, item.email, item.address, item.isActive ? "active" : "inactive"].join(" ").toLowerCase();
        return (!term || haystack.includes(term)) && (!status || (status === "active" ? item.isActive : !item.isActive));
    });
    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="8" class="table-state">No vendors found. Use Add Vendor to register a vendor for future assignments.</td></tr>';
    } else {
        tableBody.innerHTML = filtered.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.vendorCode)}</td>
                <td>${escapeHtml(item.vendorName)}</td>
                <td>${escapeHtml(item.contactPerson || "—")}</td>
                <td>${escapeHtml(item.contactNumber || "—")}</td>
                <td>${escapeHtml(item.email || "—")}</td>
                <td><span class="rv-badge ${item.isActive ? "active" : "inactive"}">${item.isActive ? "Active" : "Inactive"}</span></td>
                <td><button type="button" class="rv-action-button" data-action="edit" data-id="${item.vendorId}">Edit</button></td>
            </tr>`).join("");
    }
    recordSummary.textContent = `Showing ${filtered.length} of ${vendors.length} record${vendors.length === 1 ? "" : "s"}`;
}

function openAddModal() {
    editingId = null;
    form.reset();
    isActive.checked = true;
    statusText.textContent = "Active";
    modalTitle.textContent = "Add Vendor";
    saveButton.textContent = "Save Vendor";
    clearFormMessage();
    modal.hidden = false;
    vendorCode.focus();
}
function openEditModal(id) {
    const item = vendors.find(vendor => vendor.vendorId === id);
    if (!item) return;
    editingId = id;
    form.reset();
    vendorCode.value = item.vendorCode || "";
    vendorName.value = item.vendorName || "";
    contactPerson.value = item.contactPerson || "";
    contactNumber.value = item.contactNumber || "";
    email.value = item.email || "";
    address.value = item.address || "";
    isActive.checked = Boolean(item.isActive);
    statusText.textContent = isActive.checked ? "Active" : "Inactive";
    modalTitle.textContent = "Edit Vendor";
    saveButton.textContent = "Update Vendor";
    clearFormMessage();
    modal.hidden = false;
}
function closeModal() { modal.hidden = true; editingId = null; clearFormMessage(); }

async function saveVendor() {
    clearFormMessage();
    const code = vendorCode.value.trim();
    const name = vendorName.value.trim();
    const emailValue = email.value.trim();
    if (!code || !name) { showFormMessage("Vendor code and vendor name are required."); return; }
    if (emailValue && !email.checkValidity()) { showFormMessage("Enter a valid email address or leave it blank."); email.focus(); return; }
    const payload = {
        vendorCode: code, vendorName: name,
        contactPerson: contactPerson.value.trim() || null,
        contactNumber: contactNumber.value.trim() || null,
        email: emailValue || null,
        address: address.value.trim() || null,
        isActive: isActive.checked
    };
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
        await loadVendors();
        showPageMessage(wasAdd ? "Vendor saved successfully." : "Vendor updated successfully.");
    } catch (error) {
        console.error(error);
        showFormMessage(error.message || "Unable to save vendor.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId === null ? "Save Vendor" : "Update Vendor";
    }
}

function logout() { sessionStorage.clear(); window.location.replace("/pages/login.html"); }
document.getElementById("addButton").addEventListener("click", openAddModal);
document.getElementById("closeModalButton").addEventListener("click", closeModal);
document.getElementById("cancelButton").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
form.addEventListener("submit", event => { event.preventDefault(); saveVendor(); });
isActive.addEventListener("change", () => { statusText.textContent = isActive.checked ? "Active" : "Inactive"; });
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
tableBody.addEventListener("click", event => { const button = event.target.closest("[data-action='edit']"); if (button) openEditModal(Number(button.dataset.id)); });
document.getElementById("menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.getElementById("logoutButton").addEventListener("click", logout);
loadVendors();
