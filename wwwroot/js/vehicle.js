"use strict";

/* =========================================================
   CHT MANAGEMENT SYSTEM
   VEHICLE MASTER
   ========================================================= */

const API_URL = "/api/Vehicle";


/* ---------- Authentication ---------- */

const token =
    sessionStorage.getItem("token");

if (!token) {
    window.location.replace("/pages/login.html");
}


/* ---------- User ---------- */

const username =
    sessionStorage.getItem("username") || "User";

const role =
    sessionStorage.getItem("role") || "-";


document.getElementById("headerUsername").textContent =
    username;

document.getElementById("headerRole").textContent =
    role;

document.getElementById("userInitial").textContent =
    username.charAt(0).toUpperCase();


/* ---------- Elements ---------- */

const tableBody =
    document.getElementById("vehicleTableBody");

const searchInput =
    document.getElementById("searchInput");

const recordSummary =
    document.getElementById("recordSummary");

const modal =
    document.getElementById("vehicleModal");

const modalTitle =
    document.getElementById("modalTitle");

const form =
    document.getElementById("vehicleForm");

const vehicleId =
    document.getElementById("vehicleId");

const vehicleCode =
    document.getElementById("vehicleCode");

const vehicleType =
    document.getElementById("vehicleType");

const isActive =
    document.getElementById("isActive");

const statusText =
    document.getElementById("statusText");

const formMessage =
    document.getElementById("formMessage");

const addButton =
    document.getElementById("addVehicleButton");

const closeModalButton =
    document.getElementById("closeModalButton");

const cancelButton =
    document.getElementById("cancelButton");

const saveButton =
    document.getElementById("saveButton");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.querySelector(".sidebar");


/* ---------- Data ---------- */

let vehicles = [];

let editingId = null;


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {

    const headers = {
        ...(options.headers || {})
    };


    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] =
            "application/json";
    }


    if (token) {
        headers["Authorization"] =
            `Bearer ${token}`;
    }


    const response = await fetch(url, {
        ...options,
        headers
    });


    if (response.status === 401) {

        sessionStorage.clear();

        window.location.replace(
            "/pages/login.html"
        );

        return null;
    }


    return response;
}


/* =========================================================
   LOAD
   ========================================================= */

async function loadVehicles() {

    renderLoading();

    try {

        const response =
            await apiRequest(
                API_URL,
                {
                    method: "GET"
                }
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load vehicle types."
            );
        }


        vehicles =
            await response.json();


        renderTable();

    }
    catch (error) {

        console.error(error);

        renderError(
            "Unable to load vehicle types."
        );
    }
}


/* =========================================================
   TABLE
   ========================================================= */

function renderTable() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        vehicles.filter(item => {

            const code =
                (item.vehicleCode || "")
                    .toLowerCase();

            const type =
                (item.vehicleType || "")
                    .toLowerCase();

            return (
                code.includes(searchTerm) ||
                type.includes(searchTerm)
            );
        });


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-state"
                >
                    No vehicle types found.
                </td>
            </tr>
        `;

        recordSummary.textContent =
            "Showing 0 records";

        return;
    }


    tableBody.innerHTML =
        filtered.map((item, index) => {

            const statusClass =
                item.isActive
                    ? "active"
                    : "inactive";

            const currentStatus =
                item.isActive
                    ? "Active"
                    : "Inactive";


            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td class="code-cell">
                        ${escapeHtml(
                item.vehicleCode
            )}
                    </td>

                    <td>
                        ${escapeHtml(
                item.vehicleType
            )}
                    </td>

                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${currentStatus}
                        </span>
                    </td>

                    <td class="action-cell">

                        <button
                            type="button"
                            class="action-button"
                            title="Edit"
                            data-action="edit"
                            data-id="${item.vehicleId}"
                        >
                            ⋮
                        </button>

                    </td>

                </tr>
            `;
        }).join("");


    recordSummary.textContent =
        `Showing ${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}


/* =========================================================
   MODAL
   ========================================================= */

function openAddModal() {

    editingId = null;

    modalTitle.textContent =
        "Add Vehicle Type";

    saveButton.textContent =
        "Save Vehicle Type";

    form.reset();

    vehicleId.value = "";

    isActive.checked = true;

    statusText.textContent =
        "Active";

    clearFormMessage();

    modal.hidden = false;

    vehicleCode.focus();
}


function openEditModal(id) {

    const item =
        vehicles.find(
            x => x.vehicleId === id
        );


    if (!item) {
        return;
    }


    editingId = id;

    modalTitle.textContent =
        "Edit Vehicle Type";

    saveButton.textContent =
        "Update Vehicle Type";


    vehicleId.value =
        item.vehicleId;

    vehicleCode.value =
        item.vehicleCode || "";

    vehicleType.value =
        item.vehicleType || "";

    isActive.checked =
        Boolean(item.isActive);

    statusText.textContent =
        item.isActive
            ? "Active"
            : "Inactive";


    clearFormMessage();

    modal.hidden = false;

    vehicleCode.focus();
}


function closeModal() {

    modal.hidden = true;

    editingId = null;

    clearFormMessage();
}


function clearFormMessage() {

    formMessage.textContent = "";
}


/* =========================================================
   SAVE
   ========================================================= */

async function saveVehicle() {

    clearFormMessage();


    const code =
        vehicleCode.value.trim();

    const type =
        vehicleType.value.trim();


    if (!code) {

        showFormMessage(
            "Please enter vehicle code."
        );

        vehicleCode.focus();

        return;
    }


    if (!type) {

        showFormMessage(
            "Please enter vehicle type."
        );

        vehicleType.focus();

        return;
    }


    const payload = {

        vehicleCode:
            code,

        vehicleType:
            type,

        isActive:
            isActive.checked

    };


    setSaveLoading(true);


    try {

        let response;


        if (editingId === null) {

            response =
                await apiRequest(
                    API_URL,
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

        }
        else {

            response =
                await apiRequest(
                    `${API_URL}/${editingId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    }
                );
        }


        if (!response) {
            return;
        }


        if (!response.ok) {

            const data =
                await readErrorResponse(response);

            throw new Error(data);
        }


        closeModal();

        await loadVehicles();

    }
    catch (error) {

        console.error(error);

        showFormMessage(
            error.message ||
            "Unable to save vehicle type."
        );

    }
    finally {

        setSaveLoading(false);
    }
}


/* =========================================================
   UTILITIES
   ========================================================= */

function renderLoading() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="table-state"
            >
                Loading vehicle types...
            </td>
        </tr>
    `;

    recordSummary.textContent =
        "Loading...";
}


function renderError(message) {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="table-state"
            >
                ${escapeHtml(message)}
            </td>
        </tr>
    `;

    recordSummary.textContent =
        "Unable to load records.";
}


function showFormMessage(message) {

    formMessage.textContent =
        message;
}


function clearFormMessage() {

    formMessage.textContent = "";
}


function setSaveLoading(isLoading) {

    saveButton.disabled =
        isLoading;

    saveButton.textContent =
        isLoading
            ? "Saving..."
            : editingId === null
                ? "Save Vehicle Type"
                : "Update Vehicle Type";
}


async function readErrorResponse(response) {

    try {

        const data =
            await response.json();

        return (
            data.message ||
            "The request could not be completed."
        );

    }
    catch {

        return (
            "The request could not be completed."
        );
    }
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


/* =========================================================
   EVENTS
   ========================================================= */

addButton.addEventListener(
    "click",
    openAddModal
);


closeModalButton.addEventListener(
    "click",
    closeModal
);


cancelButton.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === modal
        ) {
            closeModal();
        }
    }
);


form.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        saveVehicle();
    }
);


isActive.addEventListener(
    "change",
    function () {

        statusText.textContent =
            isActive.checked
                ? "Active"
                : "Inactive";
    }
);


searchInput.addEventListener(
    "input",
    renderTable
);


tableBody.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            Number(button.dataset.id);


        if (
            button.dataset.action ===
            "edit"
        ) {

            openEditModal(id);

        }
    }
);


/* ---------- Mobile Menu ---------- */

menuButton.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("open");

    }
);


/* ---------- Initial Load ---------- */

loadVehicles();