"use strict";

/* =========================================================
   CHT MANAGEMENT SYSTEM
   LOCATION MASTER
   ========================================================= */

const LOCATION_API = "/api/Location";
const LOCATION_TYPE_API = "/api/LocationType";


/* ---------- Authentication ---------- */

const token = sessionStorage.getItem("token");

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
    document.getElementById("locationTableBody");

const searchInput =
    document.getElementById("searchInput");

const recordSummary =
    document.getElementById("recordSummary");

const modal =
    document.getElementById("locationModal");

const modalTitle =
    document.getElementById("modalTitle");

const form =
    document.getElementById("locationForm");

const locationId =
    document.getElementById("locationId");

const locationCode =
    document.getElementById("locationCode");

const locationName =
    document.getElementById("locationName");

const locationTypeId =
    document.getElementById("locationTypeId");

const isActive =
    document.getElementById("isActive");

const statusText =
    document.getElementById("statusText");

const formMessage =
    document.getElementById("formMessage");

const addButton =
    document.getElementById("addLocationButton");

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

let locations = [];
let locationTypes = [];
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
   LOAD LOCATION TYPES
   ========================================================= */

async function loadLocationTypes() {

    try {

        const response =
            await apiRequest(
                LOCATION_TYPE_API,
                {
                    method: "GET"
                }
            );


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


        populateLocationTypes();

    }
    catch (error) {

        console.error(error);

        showFormMessage(
            "Unable to load location types."
        );
    }
}


/* =========================================================
   POPULATE LOCATION TYPE DROPDOWN
   ========================================================= */

function populateLocationTypes() {

    locationTypeId.innerHTML =
        `<option value="">
            Select location type
        </option>`;


    locationTypes
        .filter(x => x.isActive)
        .forEach(item => {

            const option =
                document.createElement("option");

            option.value =
                item.locationTypeId;

            option.textContent =
                item.locationTypeName;

            locationTypeId.appendChild(option);
        });
}


/* =========================================================
   LOAD LOCATIONS
   ========================================================= */

async function loadLocations() {

    renderLoading();

    try {

        const response =
            await apiRequest(
                LOCATION_API,
                {
                    method: "GET"
                }
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load locations."
            );
        }


        locations =
            await response.json();


        renderTable();

    }
    catch (error) {

        console.error(error);

        renderError(
            "Unable to load locations."
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
        locations.filter(item => {

            const code =
                (item.locationCode || "")
                    .toLowerCase();

            const name =
                (item.locationName || "")
                    .toLowerCase();

            const type =
                getLocationTypeName(
                    item.locationTypeId
                ).toLowerCase();


            return (
                code.includes(searchTerm) ||
                name.includes(searchTerm) ||
                type.includes(searchTerm)
            );
        });


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="table-state"
                >
                    No locations found.
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
                item.locationCode
            )}
                    </td>

                    <td>
                        ${escapeHtml(
                item.locationName
            )}
                    </td>

                    <td>
                        ${escapeHtml(
                getLocationTypeName(
                    item.locationTypeId
                )
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
                            data-id="${item.locationId}"
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


/* ---------- Helpers ---------- */

function getLocationTypeName(id) {

    const type =
        locationTypes.find(
            x => x.locationTypeId === id
        );


    return type
        ? type.locationTypeName
        : "Unknown";
}


function renderLoading() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="table-state"
            >
                Loading locations...
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
                colspan="6"
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
        "Add Location";

    saveButton.textContent =
        "Save Location";

    form.reset();

    locationId.value = "";

    isActive.checked = true;

    statusText.textContent =
        "Active";

    clearFormMessage();

    populateLocationTypes();

    modal.hidden = false;

    locationCode.focus();
}


function openEditModal(id) {

    const item =
        locations.find(
            x => x.locationId === id
        );


    if (!item) {
        return;
    }


    editingId = id;

    modalTitle.textContent =
        "Edit Location";

    saveButton.textContent =
        "Update Location";


    locationId.value =
        item.locationId;

    locationCode.value =
        item.locationCode || "";

    locationName.value =
        item.locationName || "";

    populateLocationTypes();

    locationTypeId.value =
        item.locationTypeId;

    isActive.checked =
        Boolean(item.isActive);

    statusText.textContent =
        item.isActive
            ? "Active"
            : "Inactive";


    clearFormMessage();

    modal.hidden = false;

    locationCode.focus();
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

async function saveLocation() {

    clearFormMessage();


    const code =
        locationCode.value.trim();

    const name =
        locationName.value.trim();

    const typeId =
        Number(locationTypeId.value);


    if (!code) {

        showFormMessage(
            "Please enter location code."
        );

        locationCode.focus();

        return;
    }


    if (!name) {

        showFormMessage(
            "Please enter location name."
        );

        locationName.focus();

        return;
    }


    if (!typeId) {

        showFormMessage(
            "Please select a location type."
        );

        locationTypeId.focus();

        return;
    }


    const payload = {

        locationCode:
            code,

        locationName:
            name,

        locationTypeId:
            typeId,

        isActive:
            isActive.checked

    };


    setSaveLoading(true);


    try {

        let response;


        if (editingId === null) {

            response =
                await apiRequest(
                    LOCATION_API,
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

        }
        else {

            response =
                await apiRequest(
                    `${LOCATION_API}/${editingId}`,
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

            const errorMessage =
                await readErrorResponse(response);

            throw new Error(
                errorMessage
            );
        }


        closeModal();

        await loadLocations();

    }
    catch (error) {

        console.error(error);

        showFormMessage(
            error.message ||
            "Unable to save location."
        );

    }
    finally {

        setSaveLoading(false);
    }
}


/* =========================================================
   UTILITIES
   ========================================================= */

function setSaveLoading(isLoading) {

    saveButton.disabled =
        isLoading;

    saveButton.textContent =
        isLoading
            ? "Saving..."
            : editingId === null
                ? "Save Location"
                : "Update Location";
}


function showFormMessage(message) {

    formMessage.textContent =
        message;
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

        saveLocation();
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


/* =========================================================
   INITIAL LOAD
   ========================================================= */

async function initialize() {

    await loadLocationTypes();

    await loadLocations();

}


initialize();