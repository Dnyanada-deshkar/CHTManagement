"use strict";

/* =========================================================
   CHT MANAGEMENT SYSTEM
   LOCATION TYPE MASTER
   ========================================================= */

const API_URL = "/api/LocationType";


/* ---------- Authentication ---------- */

const token = sessionStorage.getItem("token");

if (!token) {
    window.location.replace("/pages/login.html");
}


/* ---------- Current User ---------- */

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
    document.getElementById("locationTypeTableBody");

const searchInput =
    document.getElementById("searchInput");

const recordSummary =
    document.getElementById("recordSummary");

const modal =
    document.getElementById("locationTypeModal");

const modalTitle =
    document.getElementById("modalTitle");

const form =
    document.getElementById("locationTypeForm");

const locationTypeId =
    document.getElementById("locationTypeId");

const locationTypeCode =
    document.getElementById("locationTypeCode");

const locationTypeName =
    document.getElementById("locationTypeName");

const isActive =
    document.getElementById("isActive");

const statusText =
    document.getElementById("statusText");

const formMessage =
    document.getElementById("formMessage");

const addButton =
    document.getElementById("addLocationTypeButton");

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

let locationTypes = [];

let editingId = null;


/* =========================================================
   API
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
   LOAD DATA
   ========================================================= */

async function loadLocationTypes() {

    renderLoading();

    try {

        const response =
            await apiRequest(API_URL, {
                method: "GET"
            });


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load location types."
            );
        }


        locationTypes =
            await response.json();


        renderTable();

    }
    catch (error) {

        console.error(error);

        renderError(
            "Unable to load location types."
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
        locationTypes.filter(item => {

            const code =
                (item.locationTypeCode || "")
                    .toLowerCase();

            const name =
                (item.locationTypeName || "")
                    .toLowerCase();

            return (
                code.includes(searchTerm) ||
                name.includes(searchTerm)
            );
        });


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-state"
                >
                    No location types found.
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

            const statusTextValue =
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
                item.locationTypeCode
            )}
                    </td>

                    <td>
                        ${escapeHtml(
                item.locationTypeName
            )}
                    </td>

                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${statusTextValue}
                        </span>
                    </td>

                    <td class="action-cell">

                        <button
                            type="button"
                            class="action-button"
                            title="Edit"
                            data-action="edit"
                            data-id="${item.locationTypeId}"
                        >
                            ⋮
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    const total =
        filtered.length;

    recordSummary.textContent =
        `Showing ${total} record${total === 1 ? "" : "s"}`;
}


/* ---------- Loading ---------- */

function renderLoading() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="table-state"
            >
                Loading location types...
            </td>
        </tr>
    `;

    recordSummary.textContent =
        "Loading...";
}


/* ---------- Error ---------- */

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


/* =========================================================
   MODAL
   ========================================================= */

function openAddModal() {

    editingId = null;

    modalTitle.textContent =
        "Add Location Type";

    saveButton.textContent =
        "Save Location Type";

    form.reset();

    locationTypeId.value = "";

    isActive.checked = true;

    statusText.textContent =
        "Active";

    clearFormMessage();

    modal.hidden = false;

    locationTypeCode.focus();
}


function openEditModal(id) {

    const item =
        locationTypes.find(
            x => x.locationTypeId === id
        );


    if (!item) {
        return;
    }


    editingId = id;

    modalTitle.textContent =
        "Edit Location Type";

    saveButton.textContent =
        "Update Location Type";


    locationTypeId.value =
        item.locationTypeId;

    locationTypeCode.value =
        item.locationTypeCode || "";

    locationTypeName.value =
        item.locationTypeName || "";

    isActive.checked =
        Boolean(item.isActive);

    statusText.textContent =
        item.isActive
            ? "Active"
            : "Inactive";


    clearFormMessage();

    modal.hidden = false;

    locationTypeCode.focus();
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

async function saveLocationType() {

    clearFormMessage();


    const code =
        locationTypeCode.value.trim();

    const name =
        locationTypeName.value.trim();


    if (!code) {

        showFormMessage(
            "Please enter location type code."
        );

        locationTypeCode.focus();

        return;
    }


    if (!name) {

        showFormMessage(
            "Please enter location type name."
        );

        locationTypeName.focus();

        return;
    }


    const payload = {

        locationTypeCode:
            code,

        locationTypeName:
            name,

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

            const errorData =
                await readErrorResponse(response);


            throw new Error(
                errorData
            );
        }


        closeModal();

        await loadLocationTypes();

    }
    catch (error) {

        console.error(error);

        showFormMessage(
            error.message ||
            "Unable to save location type."
        );

    }
    finally {

        setSaveLoading(false);

    }
}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteLocationType(id) {

    const item =
        locationTypes.find(
            x => x.locationTypeId === id
        );


    if (!item) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${item.locationTypeName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await apiRequest(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await readErrorResponse(response);

            throw new Error(
                errorData
            );
        }


        await loadLocationTypes();

    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to delete location type."
        );
    }
}


/* =========================================================
   UTILITIES
   ========================================================= */

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


function showFormMessage(message) {

    formMessage.textContent =
        message;
}


function setSaveLoading(isLoading) {

    saveButton.disabled =
        isLoading;

    saveButton.textContent =
        isLoading
            ? "Saving..."
            : editingId === null
                ? "Save Location Type"
                : "Update Location Type";
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

        saveLocationType();
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
            Number(
                button.dataset.id
            );


        const action =
            button.dataset.action;


        if (action === "edit") {

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


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadLocationTypes();