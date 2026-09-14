import { auth } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const BACKEND_URL = "https://urlify-api.onrender.com";

// =====================================================
// ELEMENTS
// =====================================================

const totalUsers = document.getElementById("totalUsers");
const totalLinks = document.getElementById("totalLinks");
const totalClicks = document.getElementById("totalClicks");
const linksToday = document.getElementById("linksToday");

const topLinksContainer =
document.getElementById("topLinksContainer");

const usersContainer =
document.getElementById("usersContainer");

const linksTableBody =
document.getElementById("linksTableBody");

const searchInput =
document.getElementById("searchInput");

const logoutBtn =
document.getElementById("logoutBtn");

const toast =
document.getElementById("toast");

let allLinks = [];

// =====================================================
// TOAST
// =====================================================

function showToast(message) {


if (!toast) {
    alert(message);
    return;
}

toast.textContent = message;
toast.classList.add("show");

setTimeout(() => {
    toast.classList.remove("show");
}, 3000);


}

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {


const div = document.createElement("div");

div.textContent = value ?? "";

return div.innerHTML;


}

// =====================================================
// API REQUEST
// =====================================================

async function adminFetch(endpoint, options = {}) {


const user = auth.currentUser;

if (!user) {
    throw new Error("You are not logged in.");
}


const token = await user.getIdToken();


const response = await fetch(
    `${BACKEND_URL}${endpoint}`,
    {
        ...options,

        headers: {
            ...options.headers,

            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json"
        }
    }
);


if (!response.ok) {

    let errorMessage =
        `Request failed: ${response.status}`;


    try {

        const data = await response.json();

        if (data.detail) {
            errorMessage = data.detail;
        }

    } catch (error) {

        console.error(
            "Error reading server response:",
            error
        );
    }


    throw new Error(errorMessage);
}


return await response.json();


}

// =====================================================
// LOAD OVERVIEW
// =====================================================

async function loadOverview() {


const data = await adminFetch(
    "/api/admin/overview"
);


totalUsers.textContent =
    data.total_users_with_links;

totalLinks.textContent =
    data.total_links;

totalClicks.textContent =
    data.total_clicks;


const todayData = await adminFetch(
    "/api/admin/links/today"
);


linksToday.textContent =
    todayData.count;


}

// =====================================================
// LOAD ALL LINKS
// =====================================================

async function loadAllLinks() {


const data = await adminFetch(
    "/api/admin/links"
);


allLinks = Array.isArray(data)
    ? data
    : [];


renderLinks(allLinks);


}

// =====================================================
// RENDER LINKS TABLE
// =====================================================

function renderLinks(links) {


if (!linksTableBody) {
    return;
}


if (links.length === 0) {

    linksTableBody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty-state">

                    <div class="empty-state-icon">
                        🔗
                    </div>

                    <p>
                        No links found.
                    </p>

                </div>
            </td>
        </tr>
    `;

    return;
}


linksTableBody.innerHTML = links
    .map(link => {

        const date = link.created_at
            ? new Date(
                link.created_at
            ).toLocaleString()
            : "Unknown";


        return `
            <tr>

                <td>
                    <span class="short-code">
                        ${escapeHTML(
                            link.short_code
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        link.original_url
                    )}
                </td>

                <td>
                    <span class="click-count">
                        ${Number(link.clicks) || 0}
                    </span>
                </td>

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>
                    <button
                        class="delete-btn"
                        data-code="${escapeHTML(
                            link.short_code
                        )}"
                    >
                        Delete
                    </button>
                </td>

            </tr>
        `;
    })
    .join("");


const deleteButtons =
    document.querySelectorAll(
        ".delete-btn"
    );


deleteButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const code =
                button.dataset.code;

            deleteLink(code);
        }
    );
});


}

// =====================================================
// LOAD TOP LINKS
// =====================================================

async function loadTopLinks() {


const data = await adminFetch(
    "/api/admin/links/top"
);


const links = Array.isArray(data)
    ? data
    : [];


if (!topLinksContainer) {
    return;
}


if (links.length === 0) {

    topLinksContainer.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon">
                📊
            </div>

            <p>
                No links available yet.
            </p>

        </div>
    `;

    return;
}


topLinksContainer.innerHTML = `

    <div class="table-wrapper">

        <table class="admin-table">

            <thead>
                <tr>

                    <th>
                        Short Code
                    </th>

                    <th>
                        Clicks
                    </th>

                </tr>
            </thead>

            <tbody>

                ${links
                    .map(link => `
                        <tr>

                            <td>
                                <span class="short-code">
                                    ${escapeHTML(
                                        link.short_code
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="click-count">
                                    ${Number(
                                        link.clicks
                                    ) || 0}
                                </span>
                            </td>

                        </tr>
                    `)
                    .join("")}

            </tbody>

        </table>

    </div>
`;


}

// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {


const data = await adminFetch(
    "/api/admin/users"
);


const users = Array.isArray(data.users)
    ? data.users
    : [];


if (!usersContainer) {
    return;
}


if (users.length === 0) {

    usersContainer.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon">
                👥
            </div>

            <p>
                No users with links yet.
            </p>

        </div>
    `;

    return;
}


usersContainer.innerHTML = `

    <div class="table-wrapper">

        <table class="admin-table">

            <thead>
                <tr>

                    <th>
                        User ID
                    </th>

                    <th>
                        Links
                    </th>

                    <th>
                        Clicks
                    </th>

                </tr>
            </thead>

            <tbody>

                ${users
                    .map(user => `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    user.firebase_uid
                                )}
                            </td>

                            <td>
                                ${Number(
                                    user.total_links
                                ) || 0}
                            </td>

                            <td>
                                ${Number(
                                    user.total_clicks
                                ) || 0}
                            </td>

                        </tr>
                    `)
                    .join("")}

            </tbody>

        </table>

    </div>
`;


}

// =====================================================
// DELETE LINK
// =====================================================

async function deleteLink(shortCode) {


if (!shortCode) {
    return;
}


const confirmed = window.confirm(
    `Are you sure you want to delete "${shortCode}"?`
);


if (!confirmed) {
    return;
}


try {

    await adminFetch(
        `/api/admin/links/${encodeURIComponent(
            shortCode
        )}`,
        {
            method: "DELETE"
        }
    );


    showToast(
        "Link deleted successfully."
    );


    await loadDashboard();

} catch (error) {

    console.error(
        "Delete link error:",
        error
    );


    showToast(
        error.message ||
        "Failed to delete link."
    );
}


}

// =====================================================
// SEARCH
// =====================================================

if (searchInput) {


searchInput.addEventListener(
    "input",
    () => {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {

            renderLinks(allLinks);

            return;
        }


        const filteredLinks =
            allLinks.filter(link => {

                const shortCode =
                    String(
                        link.short_code || ""
                    ).toLowerCase();


                const originalURL =
                    String(
                        link.original_url || ""
                    ).toLowerCase();


                return (
                    shortCode.includes(query) ||
                    originalURL.includes(query)
                );
            });


        renderLinks(filteredLinks);
    }
);


}

// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {


logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            showToast(
                "Logout failed."
            );
        }
    }
);


}

// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {


try {

    await loadOverview();

    await loadAllLinks();

    await loadTopLinks();

    await loadUsers();

} catch (error) {

    console.error(
        "Dashboard loading error:",
        error
    );


    showToast(
        error.message ||
        "Could not load admin dashboard."
    );
}


}

// =====================================================
// FIREBASE AUTH STATE
// =====================================================

onAuthStateChanged(
auth,
async (user) => {


    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    console.log(
        "Logged in:",
        user.email
    );


    await loadDashboard();
}


);
