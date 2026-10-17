"use strict";

/* CHT Management — CHT-CIO approval stage.
   Reads only Pending with CIO records and changes approved records to Approved by CIO.
   Uses the existing JWT session and Indents table; no schema change is needed. */

(async function initializeCioApprovalPage() {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    if (!token) {
        window.location.replace("/pages/login.html");
        return;
    }

    if (role !== "CHT-CIO") {
        window.location.replace("/pages/dashboard.html");
        return;
    }

    const API_BASE = "/api/indent-cio-approval";
    const tableBody = document.getElementById("pendingTableBody");
    const searchInput = document.getElementById("searchInput");
    const recordSummary = document.getElementById("recordSummary");
    const pageMessage = document.getElementById("pageMessage");
    const refreshButton = document.getElementById("refreshButton");
    const menuButton = document.getElementById("menuButton");
    const sidebar = document.querySelector(".sidebar");
    const logoutButton = document.getElementById("logoutButton");
    const reviewModal = document.getElementById("reviewModal");
    const reviewModalTitle = document.getElementById("reviewModalTitle");
    const reviewReference = document.getElementById("reviewReference");
    const reviewDetails = document.getElementById("reviewDetails");
    const closeModalButton = document.getElementById("closeModalButton");
    const cancelReviewButton = document.getElementById("cancelReviewButton");
    const approveButton = document.getElementById("approveButton");
    const modalMessage = document.getElementById("modalMessage");

    const username = sessionStorage.getItem("username") || "CHT-CIO";
    const currentRole = sessionStorage.getItem("role") || "CHT-CIO";
    document.getElementById("headerUsername").textContent = username;
    document.getElementById("headerRole").textContent = currentRole;
    document.getElementById("userInitial").textContent = username.charAt(0).toUpperCase();

    let pendingIndents = [];
    let selectedIndent = null;
    let isApproving = false;

    async function apiRequest(url, options = {}) {
        const headers = { ...(options.headers || {}) };
        headers.Authorization = `Bearer ${token}`;
        if (options.body !== undefined) headers["Content-Type"] = "application/json";

        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.replace("/pages/login.html");
            return null;
        }
        if (response.status === 403) {
            throw new Error("Access denied. Sign in with the CHT-CIO account to use this page.");
        }
        return response;
    }

    async function loadPendingIndents() {
        clearPageMessage();
        renderLoading();
        refreshButton.disabled = true;
        try {
            const response = await apiRequest(`${API_BASE}/pending`);
            if (!response) return;
            if (!response.ok) {
                throw new Error(await getResponseMessage(response, "Unable to load logs pending with CHT-CIO."));
            }
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("The CIO approval API returned an unexpected response.");
            pendingIndents = data;
            renderTable();
        } catch (error) {
            console.error("CIO approval list error:", error);
            tableBody.innerHTML = `<tr><td colspan="9" class="table-state error">${escapeHtml(error.message || "Unable to load pending CIO approvals.")}</td></tr>`;
            recordSummary.textContent = "Unable to load records.";
            showPageMessage(error.message || "Unable to load pending CIO approvals.", true);
        } finally {
            refreshButton.disabled = false;
        }
    }

    function renderTable() {
        const term = searchInput.value.trim().toLowerCase();
        const filtered = pendingIndents.filter(item => {
            const searchable = [
                item.indentId, item.indentNumber, item.unitName, item.userDetails,
                item.vehicleType, item.locationName, item.status
            ].map(value => String(value ?? "")).join(" ").toLowerCase();
            return searchable.includes(term);
        });

        if (filtered.length === 0) {
            const message = pendingIndents.length === 0
                ? "There are no indent logs pending with CHT-CIO."
                : "No pending CIO records match your search.";
            tableBody.innerHTML = `<tr><td colspan="9" class="table-state">${escapeHtml(message)}</td></tr>`;
            recordSummary.textContent = pendingIndents.length === 0
                ? "0 records pending with CIO"
                : `Showing 0 of ${pendingIndents.length} pending records`;
            return;
        }

        tableBody.innerHTML = filtered.map((item, index) => `
            <tr>
                <td class="serial-column">${index + 1}</td>
                <td><div class="reference-cell">${escapeHtml(item.indentNumber || `Indent #${item.indentId}`)}</div><div class="secondary-cell">Log ID: ${escapeHtml(item.indentId)}</div></td>
                <td>${escapeHtml(formatDate(item.indentDate))}</td>
                <td><div>${escapeHtml(item.unitName || "—")}</div><div class="secondary-cell">${escapeHtml(item.userDetails || "")}</div></td>
                <td>${escapeHtml(formatDateTime(item.requiredDateTime))}</td>
                <td>${escapeHtml(item.vehicleQuantity ?? "—")} × ${escapeHtml(item.vehicleType || "Vehicle type unavailable")}</td>
                <td>${escapeHtml(item.locationName || "Location unavailable")}</td>
                <td><span class="status-badge">${escapeHtml(item.status || "Pending with CIO")}</span></td>
                <td class="action-column"><button type="button" class="review-button" data-action="review" data-id="${Number(item.indentId)}">Review</button></td>
            </tr>`).join("");
        recordSummary.textContent = `Showing ${filtered.length} of ${pendingIndents.length} pending record${pendingIndents.length === 1 ? "" : "s"}`;
    }

    function openReview(indentId) {
        const item = pendingIndents.find(x => Number(x.indentId) === Number(indentId));
        if (!item) return;
        selectedIndent = item;
        reviewModalTitle.textContent = "Review indent log for CIO approval";
        reviewReference.textContent = `${item.indentNumber || `Indent #${item.indentId}`} · Log ID ${item.indentId}`;
        reviewDetails.innerHTML = buildDetails(item);
        modalMessage.hidden = true;
        modalMessage.textContent = "";
        approveButton.disabled = false;
        approveButton.textContent = "Approve for Vendor Assignment";
        reviewModal.hidden = false;
        document.body.style.overflow = "hidden";
        closeModalButton.focus();
    }

    function closeReview() {
        if (isApproving) return;
        reviewModal.hidden = true;
        document.body.style.overflow = "";
        selectedIndent = null;
        reviewDetails.innerHTML = "";
        modalMessage.hidden = true;
        modalMessage.textContent = "";
    }

    function buildDetails(item) {
        const sections = [
            {
                title: "Part I — Transport Requirement",
                fields: [
                    ["Unit for which transport is required", item.unitName],
                    ["Details of User", item.userDetails],
                    ["Indent Number", item.indentNumber],
                    ["Indent Date", formatDate(item.indentDate)],
                    ["Time and date required", formatDateTime(item.requiredDateTime)],
                    ["Number of vehicles required", item.vehicleQuantity],
                    ["Vehicle type", item.vehicleType],
                    ["Where required", item.locationName],
                    ["Duration of employment", item.durationOfEmployment],
                    ["Destination", item.destination],
                    ["One-way distance", item.oneWayDistance == null ? null : `${item.oneWayDistance} km`],
                    ["Via route", item.viaRoute],
                    ["Exact nature of duty with authority", item.exactNatureOfDutyWithAuthority],
                    ["Reason standing-duty transport is not utilized", item.reasonRegimentalStandingDutyTransportNotUtilized],
                    ["Reason for CHT on Sunday/Holiday", item.reasonForUsingCHTOnSundayHoliday],
                    ["Reason for CHT to rail-connected destination", item.reasonForUsingCHTToRailConnectedDestination]
                ]
            },
            {
                title: "Indenting Officer and Unit Certificate",
                fields: [
                    ["Indenting Officer — Station", item.indentingOfficerStation],
                    ["Indenting Officer — Date", formatDate(item.indentingOfficerDate)],
                    ["OC/CO/Head of Branch — Station", item.certifyingOfficerStation],
                    ["OC/CO/Head of Branch — Date", formatDate(item.certifyingOfficerDate)]
                ]
            },
            {
                title: "Part II — STO's Transport Order",
                fields: [
                    ["Hiring Transport Register Serial No.", item.hiringTransportRegisterSerialNumber],
                    ["Budget Head", item.budgetHead],
                    ["Transport supplied — date/time", formatDateTime(item.transportSupplyDateTime)],
                    ["Details of journey", item.detailsOfJourney],
                    ["Duration of duty (days/hours)", item.durationOfDutyDaysHours],
                    ["Order — Station", item.orderStation],
                    ["Order — Date", formatDate(item.orderDate)],
                    ["Issuing Officer — Rank, Name & Designation", item.issuingOfficerRankNameDesignation]
                ]
            },
            {
                title: "Registration Details",
                fields: [
                    ["Current status", item.status],
                    ["Registered on", formatDateTime(item.createdAt)]
                ]
            }
        ];

        return sections.map(section => `
            <section class="detail-section">
                <h3>${escapeHtml(section.title)}</h3>
                <div class="detail-grid">
                    ${section.fields.map(([label, value]) => `
                        <div class="detail-item">
                            <span class="detail-label">${escapeHtml(label)}</span>
                            <div class="detail-value">${escapeHtml(value == null || value === "" ? "Not provided" : value)}</div>
                        </div>`).join("")}
                </div>
            </section>`).join("");
    }

    async function approveSelectedIndent() {
        if (!selectedIndent || isApproving) return;
        const reference = selectedIndent.indentNumber || `Indent #${selectedIndent.indentId}`;
        if (!window.confirm(`Approve ${reference} as CHT-CIO?\n\nThe log will move to Approved by CIO and become ready for Vendor Assignment.`)) return;

        isApproving = true;
        approveButton.disabled = true;
        approveButton.textContent = "Approving…";
        modalMessage.hidden = true;
        try {
            const response = await apiRequest(`${API_BASE}/${selectedIndent.indentId}/approve`, { method: "POST" });
            if (!response) return;
            if (!response.ok) {
                throw new Error(await getResponseMessage(response, "Unable to approve this indent log."));
            }
            const result = await response.json();
            const successMessage = result.message || "Indent log approved by CHT-CIO.";
            closeReviewAfterSuccess();
            showPageMessage(successMessage, false);
            await loadPendingIndents();
        } catch (error) {
            console.error("CIO approval error:", error);
            modalMessage.textContent = error.message || "Unable to approve this indent log.";
            modalMessage.hidden = false;
        } finally {
            isApproving = false;
            if (!reviewModal.hidden) {
                approveButton.disabled = false;
                approveButton.textContent = "Approve for Vendor Assignment";
            }
        }
    }

    function closeReviewAfterSuccess() {
        reviewModal.hidden = true;
        document.body.style.overflow = "";
        selectedIndent = null;
        reviewDetails.innerHTML = "";
        modalMessage.hidden = true;
        modalMessage.textContent = "";
    }

    function renderLoading() {
        tableBody.innerHTML = `<tr><td colspan="9" class="table-state">Loading pending CIO approvals…</td></tr>`;
        recordSummary.textContent = "Loading…";
    }

    function showPageMessage(message, isError) {
        pageMessage.textContent = message;
        pageMessage.classList.toggle("error", Boolean(isError));
        pageMessage.hidden = false;
    }

    function clearPageMessage() {
        pageMessage.hidden = true;
        pageMessage.textContent = "";
        pageMessage.classList.remove("error");
    }

    async function getResponseMessage(response, fallback) {
        try {
            const data = await response.json();
            return data?.message || data?.title || fallback;
        } catch {
            return fallback;
        }
    }

    function formatDate(value) {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }

    function formatDateTime(value) {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value ?? "");
        return div.innerHTML;
    }

    refreshButton.addEventListener("click", loadPendingIndents);
    searchInput.addEventListener("input", renderTable);
    tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-action='review']");
        if (button) openReview(Number(button.dataset.id));
    });
    approveButton.addEventListener("click", approveSelectedIndent);
    closeModalButton.addEventListener("click", closeReview);
    cancelReviewButton.addEventListener("click", closeReview);
    reviewModal.addEventListener("click", event => {
        if (event.target === reviewModal) closeReview();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !reviewModal.hidden) closeReview();
    });
    menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
    logoutButton.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.replace("/pages/login.html");
    });

    await loadPendingIndents();
})();
