"use strict";

/* CHT Management Operations Dashboard
   Live data sources: GET /api/Indent, GET /api/Vendor, GET /api/Vehicle.
   This dashboard intentionally avoids fixed/demo KPI values. */

const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username") || "User";
const role = sessionStorage.getItem("role") || "—";

if (!token) {
    window.location.replace("/pages/login.html");
}

const $ = (id) => document.getElementById(id);
const elements = {
    avatar: $("userAvatar"),
    username: $("headerUsername"),
    role: $("headerRole"),
    systemRole: $("systemRole"),
    welcome: $("welcomeHeading"),
    currentDate: $("currentDate"),
    currentTime: $("currentTime"),
    notice: $("dataNotice"),
    totalIndents: $("totalIndents"),
    pendingClerk: $("pendingClerk"),
    pendingCio: $("pendingCio"),
    approvedCio: $("approvedCio"),
    assignedVendor: $("assignedVendor"),
    confirmedDemand: $("confirmedDemand"),
    activeVendors: $("activeVendors"),
    activeVehicles: $("activeVehicles"),
    stepSubmitted: $("stepSubmitted"),
    stepClerk: $("stepClerk"),
    stepCio: $("stepCio"),
    stepVendor: $("stepVendor"),
    stepVehicle: $("stepVehicle"),
    clerkNavCount: $("clerkNavCount"),
    cioNavCount: $("cioNavCount"),
    tbody: $("recentTableBody"),
    recordCount: $("recordCount"),
    search: $("recentSearch"),
    refresh: $("refreshButton"),
    lastRefresh: $("lastRefresh"),
    connection: $("connectionBadge"),
    sidebar: $("dashboardSidebar"),
    scrim: $("sidebarScrim"),
    menuToggle: $("menuToggle"),
    logout: $("logoutButton")
};

const dashboardState = {
    indents: [],
    vendors: [],
    vehicles: [],
    errors: []
};

const STATUS = {
    pendingClerk: "Pending with Clerk",
    pendingCio: "Pending with CIO",
    approvedCio: "Approved by CIO",
    assignedVendor: "Assigned to Vendor",
    confirmed: "Vehicle Demand Confirmed"
};

function safeText(value, fallback = "—") {
    if (value === null || value === undefined || String(value).trim() === "") return fallback;
    return String(value);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function normaliseStatus(value) {
    return String(value ?? "").trim().toLowerCase();
}

function isSubmittedIndent(indent) {
    const current = normaliseStatus(indent.status);
    return current !== "draft" && current !== "";
}

function countStatus(status) {
    const target = normaliseStatus(status);
    return dashboardState.indents.filter((item) => normaliseStatus(item.status) === target).length;
}

function formatDate(value, includeTime = false) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const options = includeTime
        ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleString("en-IN", options);
}

function updateClock() {
    const now = new Date();
    elements.currentDate.textContent = now.toLocaleDateString("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
    });
    elements.currentTime.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit"
    });
}

function setNotice(message, isError = false) {
    elements.notice.textContent = message;
    elements.notice.classList.toggle("notice-error", isError);
    elements.notice.hidden = !message;
}

async function fetchArray(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role");
        window.location.replace("/pages/login.html");
        throw new Error("Your session expired. Please sign in again.");
    }
    if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error(`${url} did not return a list.`);
    }
    return data;
}

function statusClass(status) {
    switch (normaliseStatus(status)) {
        case "pending with clerk": return "status-pending-clerk";
        case "pending with cio": return "status-pending-cio";
        case "approved by cio": return "status-approved";
        case "assigned to vendor": return "status-assigned";
        case "vehicle demand confirmed": return "status-confirmed";
        default: return "status-other";
    }
}

function actionForStatus(status) {
    const value = normaliseStatus(status);
    if (value === "pending with clerk") {
        return role === "CHT-Clerk"
            ? { href: "/pages/clerk-approval.html", label: "Review" }
            : { href: "/pages/indent-log-register.html", label: "View log" };
    }
    if (value === "pending with cio") {
        return role === "CHT-CIO"
            ? { href: "/pages/cio-approval.html", label: "Review" }
            : { href: "/pages/indent-log-register.html", label: "View log" };
    }
    if (value === "approved by cio") return { href: "/pages/vendor-assignment.html", label: "Assign vendor" };
    if (value === "assigned to vendor") return { href: "/pages/vehicle-demand-confirmation.html", label: "Confirm vehicle" };
    if (value === "vehicle demand confirmed") return { href: "/pages/vehicle-demand-register.html", label: "View register" };
    return { href: "/pages/indent-log-register.html", label: "View log" };
}

function routeRoleLinks() {
    document.querySelectorAll(".role-link[data-role]").forEach((link) => {
        const allowedRoles = link.dataset.role.split(",").map((item) => item.trim());
        link.hidden = !allowedRoles.includes(role);
    });

    document.querySelectorAll('a[href="/pages/clerk-approval.html"].stat-link').forEach((link) => {
        link.hidden = role !== "CHT-Clerk";
    });
    document.querySelectorAll('a[href="/pages/cio-approval.html"].stat-link').forEach((link) => {
        link.hidden = role !== "CHT-CIO";
    });
}

function updateIdentity() {
    elements.username.textContent = username;
    elements.role.textContent = role;
    elements.systemRole.textContent = role;
    elements.avatar.textContent = username.charAt(0).toUpperCase() || "U";

    const hour = new Date().getHours();
    let part = "Good evening";
    if (hour < 12) part = "Good morning";
    else if (hour < 17) part = "Good afternoon";
    elements.welcome.textContent = `${part}, ${username}`;
    routeRoleLinks();
}

function renderStats() {
    const submitted = dashboardState.indents.filter(isSubmittedIndent);
    const counts = {
        clerk: countStatus(STATUS.pendingClerk),
        cio: countStatus(STATUS.pendingCio),
        approved: countStatus(STATUS.approvedCio),
        assigned: countStatus(STATUS.assignedVendor),
        confirmed: countStatus(STATUS.confirmed)
    };

    elements.totalIndents.textContent = submitted.length.toLocaleString("en-IN");
    elements.pendingClerk.textContent = counts.clerk.toLocaleString("en-IN");
    elements.pendingCio.textContent = counts.cio.toLocaleString("en-IN");
    elements.approvedCio.textContent = counts.approved.toLocaleString("en-IN");
    elements.assignedVendor.textContent = counts.assigned.toLocaleString("en-IN");
    elements.confirmedDemand.textContent = counts.confirmed.toLocaleString("en-IN");
    elements.activeVendors.textContent = dashboardState.vendors.filter((x) => x.isActive === true).length.toLocaleString("en-IN");
    elements.activeVehicles.textContent = dashboardState.vehicles.filter((x) => x.isActive === true).length.toLocaleString("en-IN");

    elements.stepSubmitted.textContent = submitted.length.toLocaleString("en-IN");
    elements.stepClerk.textContent = counts.clerk.toLocaleString("en-IN");
    elements.stepCio.textContent = counts.cio.toLocaleString("en-IN");
    elements.stepVendor.textContent = (counts.approved + counts.assigned).toLocaleString("en-IN");
    elements.stepVehicle.textContent = counts.confirmed.toLocaleString("en-IN");

    elements.clerkNavCount.textContent = counts.clerk.toLocaleString("en-IN");
    elements.cioNavCount.textContent = counts.cio.toLocaleString("en-IN");
}

function getVehicleText(indent) {
    const type = indent.vehicle?.vehicleType ?? indent.Vehicle?.VehicleType ?? indent.vehicleType;
    const quantity = indent.vehicleQuantity ?? indent.VehicleQuantity;
    if (type && quantity != null) return `${quantity} × ${type}`;
    if (type) return String(type);
    if (quantity != null) return `${quantity} vehicle(s)`;
    return "—";
}

function getUnit(indent) {
    return indent.unitName ?? indent.UnitName ?? indent.userDetails ?? indent.UserDetails ?? "—";
}
function getDestination(indent) {
    return indent.destination ?? indent.Destination ?? "—";
}
function getRequiredDate(indent) {
    return indent.requiredDateTime ?? indent.RequiredDateTime;
}
function getCreatedAt(indent) {
    return indent.createdAt ?? indent.CreatedAt;
}
function getIndentNumber(indent) {
    return indent.indentNumber ?? indent.IndentNumber;
}
function getIndentId(indent) {
    return indent.indentId ?? indent.IndentId;
}
function getStatus(indent) {
    return indent.status ?? indent.Status ?? "—";
}

function renderRecentRows() {
    const query = elements.search.value.trim().toLowerCase();
    const submitted = dashboardState.indents
        .filter(isSubmittedIndent)
        .slice()
        .sort((a, b) => new Date(getCreatedAt(b) || 0).getTime() - new Date(getCreatedAt(a) || 0).getTime());

    const filtered = submitted.filter((indent) => {
        const searchable = [
            getIndentId(indent), getIndentNumber(indent), getUnit(indent), getDestination(indent), getStatus(indent), getVehicleText(indent)
        ].join(" ").toLowerCase();
        return searchable.includes(query);
    });
    const shown = filtered.slice(0, 8);

    if (shown.length === 0) {
        const message = dashboardState.errors.includes("indents")
            ? "Could not load indent records. Use Refresh data to try again."
            : query ? "No records match your search." : "No submitted indent logs are available yet.";
        elements.tbody.innerHTML = `<tr><td colspan="8" class="table-state">${escapeHtml(message)}</td></tr>`;
        elements.recordCount.textContent = query ? "0 matching records" : "No submitted records";
        return;
    }

    elements.tbody.innerHTML = shown.map((indent) => {
        const id = getIndentId(indent);
        const status = getStatus(indent);
        const action = actionForStatus(status);
        const indentNumber = safeText(getIndentNumber(indent));
        return `<tr>
            <td><span class="table-ref">${escapeHtml(id ?? "—")}</span></td>
            <td><span class="table-indent">${escapeHtml(indentNumber)}</span></td>
            <td>${escapeHtml(safeText(getUnit(indent)))}</td>
            <td>${escapeHtml(formatDate(getRequiredDate(indent), true))}</td>
            <td>${escapeHtml(getVehicleText(indent))}</td>
            <td>${escapeHtml(safeText(getDestination(indent)))}</td>
            <td><span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span></td>
            <td><a class="row-action" href="${action.href}">${escapeHtml(action.label)} <span aria-hidden="true">→</span></a></td>
        </tr>`;
    }).join("");

    elements.recordCount.textContent = query
        ? `Showing ${shown.length} of ${filtered.length} matching record${filtered.length === 1 ? "" : "s"}`
        : `Showing ${shown.length} of ${submitted.length} submitted record${submitted.length === 1 ? "" : "s"}`;
}

async function loadDashboard() {
    elements.refresh.disabled = true;
    elements.refresh.innerHTML = '<span aria-hidden="true">↻</span> Refreshing…';
    setNotice("");
    elements.connection.className = "connection-badge";
    elements.connection.innerHTML = "<i></i> Checking";
    dashboardState.errors = [];

    const results = await Promise.allSettled([
        fetchArray("/api/Indent"),
        fetchArray("/api/Vendor"),
        fetchArray("/api/Vehicle")
    ]);

    const keys = ["indents", "vendors", "vehicles"];
    results.forEach((result, index) => {
        const key = keys[index];
        if (result.status === "fulfilled") {
            dashboardState[key] = result.value;
        } else {
            dashboardState.errors.push(key);
            console.error(`Dashboard failed to load ${key}:`, result.reason);
        }
    });

    renderStats();
    renderRecentRows();
    elements.lastRefresh.textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    if (dashboardState.errors.length === 0) {
        elements.connection.className = "connection-badge online";
        elements.connection.innerHTML = "<i></i> Connected";
    } else if (dashboardState.errors.length < 3) {
        elements.connection.className = "connection-badge partial";
        elements.connection.innerHTML = "<i></i> Partial data";
        setNotice(`Some dashboard data could not be loaded (${dashboardState.errors.join(", ")}). The page is still available; verify the related API endpoint and your login if the issue continues.`, true);
    } else {
        elements.connection.className = "connection-badge offline";
        elements.connection.innerHTML = "<i></i> Data unavailable";
        setNotice("Dashboard data could not be loaded from the API. Confirm that the application is running and your session is valid, then use Refresh data.", true);
    }

    elements.refresh.disabled = false;
    elements.refresh.innerHTML = '<span aria-hidden="true">↻</span> Refresh data';
}

function openSidebar() {
    elements.sidebar.classList.add("open");
    elements.scrim.hidden = false;
    elements.menuToggle.setAttribute("aria-expanded", "true");
}
function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.scrim.hidden = true;
    elements.menuToggle.setAttribute("aria-expanded", "false");
}

elements.search.addEventListener("input", renderRecentRows);
elements.refresh.addEventListener("click", loadDashboard);
elements.logout.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    window.location.replace("/pages/login.html");
});
elements.menuToggle.addEventListener("click", () => {
    if (elements.sidebar.classList.contains("open")) closeSidebar();
    else openSidebar();
});
elements.scrim.addEventListener("click", closeSidebar);
document.querySelectorAll(".dashboard-sidebar .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 1080px)").matches) closeSidebar();
    });
});

updateIdentity();
updateClock();
loadDashboard();
setInterval(updateClock, 30000);
