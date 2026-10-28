(() => {
    "use strict";

    const currentPath = window.location.pathname.toLowerCase();
    const currentRole = (sessionStorage.getItem("role") || "").trim();
    const isDashboard = currentPath.endsWith("/dashboard.html");

    const sharedSidebarMarkup = `
        <a class="brand-lockup sidebar-brand" href="/pages/dashboard.html" aria-label="CHT Management Dashboard">
            <span class="brand-emblem sidebar-emblem" aria-hidden="true"><span></span><span></span><i></i></span>
            <span class="brand-copy brand-text">
                <strong>LEH 503 ASC BN</strong>
                <small>CHT Management System</small>
            </span>
        </a>
        <nav class="side-navigation sidebar-nav" aria-label="Main navigation">
            <div class="nav-caption nav-section-title">OVERVIEW</div>
            <a class="nav-link nav-item" href="/pages/dashboard.html"><span class="nav-icon" aria-hidden="true">⌂</span><span>Dashboard</span></a>

            <div class="nav-caption nav-section-title">MASTERS</div>
            <a class="nav-link nav-item" href="/pages/location-type-master.html"><span class="nav-icon" aria-hidden="true">▦</span><span>Location Type Master</span></a>
            <a class="nav-link nav-item" href="/pages/location-master.html"><span class="nav-icon" aria-hidden="true">⌖</span><span>Location Master</span></a>
            <a class="nav-link nav-item" href="/pages/vehicle-master.html"><span class="nav-icon" aria-hidden="true">▣</span><span>Vehicle Master</span></a>
            <a class="nav-link nav-item" href="/pages/rate-master.html"><span class="nav-icon" aria-hidden="true">₹</span><span>Rate Master</span></a>
            <a class="nav-link nav-item" href="/pages/vendor-master.html"><span class="nav-icon" aria-hidden="true">▤</span><span>Vendor Master</span></a>

            <div class="nav-caption nav-section-title">WORKFLOW</div>
            <a class="nav-link nav-item" href="/pages/indent-registration.html"><span class="nav-icon" aria-hidden="true">＋</span><span>Indent Registration</span></a>
            <a class="nav-link nav-item role-link" data-role="CHT-Clerk" href="/pages/clerk-approval.html"><span class="nav-icon" aria-hidden="true">✓</span><span>Clerk Approval</span></a>
            <a class="nav-link nav-item role-link" data-role="CHT-CIO" href="/pages/cio-approval.html"><span class="nav-icon" aria-hidden="true">◈</span><span>CIO Approval</span></a>
            <a class="nav-link nav-item role-link" data-role="CHT-Clerk,CHT-CIO" href="/pages/vendor-assignment.html"><span class="nav-icon" aria-hidden="true">⇄</span><span>Vendor Assignment</span></a>
            <a class="nav-link nav-item role-link" data-role="CHT-Clerk,CHT-CIO" href="/pages/vehicle-demand-confirmation.html"><span class="nav-icon" aria-hidden="true">▣</span><span>Vehicle Demand Confirmation</span></a>

            <div class="nav-caption nav-section-title">REGISTERS</div>
            <a class="nav-link nav-item role-link" data-role="CHT-Clerk,CHT-CIO" href="/pages/indent-log-register.html"><span class="nav-icon" aria-hidden="true">☷</span><span>Indent Log Register</span></a>
            <a class="nav-link nav-item role-link" data-role="CHT-Clerk,CHT-CIO" href="/pages/vehicle-demand-register.html"><span class="nav-icon" aria-hidden="true">▤</span><span>Vehicle Demand Register</span></a>
        </nav>
        <div class="sidebar-bottom sidebar-footer">
            <span class="system-indicator" aria-hidden="true"></span>
            <div><strong>CHT MANAGEMENT</strong><small>Internal Operations</small></div>
        </div>
    `;

    function applyRoleVisibility(sidebar) {
        sidebar.querySelectorAll("[data-role]").forEach((link) => {
            const permittedRoles = (link.getAttribute("data-role") || "")
                .split(",")
                .map((role) => role.trim())
                .filter(Boolean);
            link.hidden = permittedRoles.length > 0 && !permittedRoles.includes(currentRole);
        });
    }

    function applyActiveLink(sidebar) {
        sidebar.querySelectorAll("a[href]").forEach((link) => {
            let linkPath = "";
            try {
                linkPath = new URL(link.getAttribute("href"), window.location.origin).pathname.toLowerCase();
            } catch {
                return;
            }

            const active = linkPath === currentPath;
            link.classList.toggle("active", active);
            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function addRegisterPageToggle() {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cht-sidebar-toggle";
        button.setAttribute("aria-label", "Open navigation");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "☰";
        document.body.appendChild(button);

        const scrim = document.createElement("div");
        scrim.className = "cht-sidebar-scrim";
        scrim.hidden = true;
        document.body.appendChild(scrim);

        const sidebar = document.querySelector(".cht-unified-sidebar");
        const close = () => {
            sidebar.classList.remove("open");
            scrim.hidden = true;
            button.setAttribute("aria-expanded", "false");
        };
        button.addEventListener("click", () => {
            const willOpen = !sidebar.classList.contains("open");
            sidebar.classList.toggle("open", willOpen);
            scrim.hidden = !willOpen;
            button.setAttribute("aria-expanded", String(willOpen));
        });
        scrim.addEventListener("click", close);
        sidebar.addEventListener("click", (event) => {
            if (event.target.closest("a[href]")) close();
        });
    }

    let sidebar = document.getElementById("dashboardSidebar");

    if (isDashboard && sidebar) {
        // Keep the dashboard's original sidebar DOM intact: dashboard.js keeps
        // references to its nav counts, scrim, and menu-toggle elements.
        applyRoleVisibility(sidebar);
        applyActiveLink(sidebar);
        return;
    }

    sidebar = document.querySelector("aside.sidebar");

    if (!sidebar) {
        // The two physical-register views didn't originally have a sidebar.
        sidebar = document.createElement("aside");
        sidebar.className = "sidebar cht-unified-sidebar";
        sidebar.id = "chtSharedSidebar";
        document.body.insertBefore(sidebar, document.body.firstChild);
        document.body.classList.add("cht-register-layout");
        sidebar.innerHTML = sharedSidebarMarkup;
        applyRoleVisibility(sidebar);
        applyActiveLink(sidebar);
        addRegisterPageToggle();
        return;
    }

    // Keep the existing outer element so each page's existing menu-button
    // handler (which already references this sidebar) continues working.
    sidebar.classList.add("cht-unified-sidebar");
    sidebar.innerHTML = sharedSidebarMarkup;
    applyRoleVisibility(sidebar);
    applyActiveLink(sidebar);

    // On mobile, close the sidebar after following one of its links.
    sidebar.addEventListener("click", (event) => {
        if (window.matchMedia("(max-width: 850px)").matches && event.target.closest("a[href]")) {
            sidebar.classList.remove("open");
        }
    });
})();
