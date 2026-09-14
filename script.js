/* =====================================================
   URLIFY V7.1
   FIREBASE AUTH + FASTAPI + ANALYTICS
===================================================== */

import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =====================================================
   API
===================================================== */

const API_URL = "http://127.0.0.1:8000/api/links";
const BACKEND_URL = "http://127.0.0.1:8000";


/* =====================================================
   STATE
===================================================== */

let history = [];
let currentShortUrl = "";
let toastTimer;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const themeBtn = document.getElementById("themeBtn");

const guestActions = document.getElementById("guestActions");
const userActions = document.getElementById("userActions");
const userEmail = document.getElementById("userEmail");
const accountStatus = document.getElementById("accountStatus");

const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginRequiredBtn =
    document.getElementById("loginRequiredBtn");

const loginRequired =
    document.getElementById("loginRequired");

const shortenerForm =
    document.getElementById("shortenerForm");

const urlInput =
    document.getElementById("urlInput");

const aliasInput =
    document.getElementById("aliasInput");

const aliasCounter =
    document.getElementById("aliasCounter");

const aliasStatus =
    document.getElementById("aliasStatus");

const aliasMessage =
    document.getElementById("aliasMessage");

const shortenBtn =
    document.getElementById("shortenBtn");

const shortenBtnText =
    document.getElementById("shortenBtnText");

const shortenLoader =
    document.getElementById("shortenLoader");

const errorMessage =
    document.getElementById("errorMessage");

const resultCard =
    document.getElementById("resultCard");

const shortUrl =
    document.getElementById("shortUrl");

const copyBtn =
    document.getElementById("copyBtn");

const openBtn =
    document.getElementById("openBtn");

const qrBtn =
    document.getElementById("qrBtn");

const qrContainer =
    document.getElementById("qrContainer");

const qrcode =
    document.getElementById("qrcode");

const downloadQrBtn =
    document.getElementById("downloadQrBtn");

const totalLinks =
    document.getElementById("totalLinks");

const totalClicks =
    document.getElementById("totalClicks");

const todayLinks =
    document.getElementById("todayLinks");

const historyList =
    document.getElementById("historyList");

const emptyHistory =
    document.getElementById("emptyHistory");

const searchInput =
    document.getElementById("searchInput");

const exportBtn =
    document.getElementById("exportBtn");

const clearBtn =
    document.getElementById("clearBtn");

const clearModal =
    document.getElementById("clearModal");

const cancelClear =
    document.getElementById("cancelClear");

const confirmClear =
    document.getElementById("confirmClear");

const toast =
    document.getElementById("toast");


/* =====================================================
   AUTH MODAL ELEMENTS
===================================================== */

const authModal =
    document.getElementById("authModal");

const closeAuthModal =
    document.getElementById("closeAuthModal");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const showRegister =
    document.getElementById("showRegister");

const showLogin =
    document.getElementById("showLogin");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const registerName =
    document.getElementById("registerName");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");

const loginError =
    document.getElementById("loginError");

const registerError =
    document.getElementById("registerError");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    updateAliasCounter();

    validateAliasLive();

    setupEvents();

    onAuthStateChanged(
        auth,
        handleAuthState
    );
});


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

    if (themeBtn) {
        themeBtn.addEventListener(
            "click",
            toggleTheme
        );
    }

    if (loginBtn) {
        loginBtn.addEventListener(
            "click",
            () => openAuthModal("login")
        );
    }

    if (registerBtn) {
        registerBtn.addEventListener(
            "click",
            () => openAuthModal("register")
        );
    }

    if (loginRequiredBtn) {
        loginRequiredBtn.addEventListener(
            "click",
            () => openAuthModal("login")
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logoutUser
        );
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener(
            "click",
            closeAuth
        );
    }

    if (showRegister) {
        showRegister.addEventListener(
            "click",
            () => switchAuthMode("register")
        );
    }

    if (showLogin) {
        showLogin.addEventListener(
            "click",
            () => switchAuthMode("login")
        );
    }

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            loginUser
        );
    }

    if (registerForm) {
        registerForm.addEventListener(
            "submit",
            registerUser
        );
    }

    if (shortenerForm) {
        shortenerForm.addEventListener(
            "submit",
            shortenURL
        );
    }

    if (aliasInput) {

        aliasInput.addEventListener(
            "input",
            () => {

                normalizeAlias();

                updateAliasCounter();

                validateAliasLive();
            }
        );
    }

    if (copyBtn) {
        copyBtn.addEventListener(
            "click",
            copyShortUrl
        );
    }

    if (openBtn) {
        openBtn.addEventListener(
            "click",
            openShortUrl
        );
    }

    if (qrBtn) {
        qrBtn.addEventListener(
            "click",
            toggleQr
        );
    }

    if (downloadQrBtn) {
        downloadQrBtn.addEventListener(
            "click",
            downloadQr
        );
    }

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderHistory
        );
    }

    if (exportBtn) {
        exportBtn.addEventListener(
            "click",
            exportCSV
        );
    }

    if (clearBtn) {
        clearBtn.addEventListener(
            "click",
            openClearModal
        );
    }

    if (cancelClear) {
        cancelClear.addEventListener(
            "click",
            closeClearModal
        );
    }

    if (confirmClear) {
        confirmClear.addEventListener(
            "click",
            clearAllLinks
        );
    }

    document.addEventListener(
        "keydown",
        handleGlobalKeydown
    );
}


/* =====================================================
   GLOBAL KEYBOARD
===================================================== */

function handleGlobalKeydown(event) {

    if (event.key !== "Escape") {
        return;
    }

    if (
        authModal &&
        !authModal.classList.contains("hidden")
    ) {
        closeAuth();
    }

    if (
        clearModal &&
        !clearModal.classList.contains("hidden")
    ) {
        closeClearModal();
    }
}


/* =====================================================
   FIREBASE AUTH STATE
===================================================== */

async function handleAuthState(user) {

    if (user) {

        console.log(
            "Logged in:",
            user.email
        );

        if (guestActions) {
            guestActions.classList.add("hidden");
        }

        if (userActions) {
            userActions.classList.remove("hidden");
        }

        if (loginRequired) {
            loginRequired.classList.add("hidden");
        }

        if (shortenerForm) {
            shortenerForm.classList.remove("hidden");
        }

        if (userEmail) {
            userEmail.textContent =
                user.email || "User";
        }

        if (accountStatus) {
            accountStatus.textContent =
                "Logged in";
        }

        await loadHistoryFromBackend();

        await loadAnalytics();

    } else {

        console.log(
            "No user logged in"
        );

        if (guestActions) {
            guestActions.classList.remove("hidden");
        }

        if (userActions) {
            userActions.classList.add("hidden");
        }

        if (loginRequired) {
            loginRequired.classList.remove("hidden");
        }

        if (shortenerForm) {
            shortenerForm.classList.add("hidden");
        }

        if (accountStatus) {
            accountStatus.textContent =
                "Guest";
        }

        history = [];

        currentShortUrl = "";

        renderHistory();

        updateStats();

        if (totalClicks) {
            totalClicks.textContent = "0";
        }

        if (resultCard) {
            resultCard.classList.add("hidden");
        }
    }
}


/* =====================================================
   REGISTER
===================================================== */

async function registerUser(event) {

    event.preventDefault();

    hideAuthError(registerError);

    const name =
        registerName
            ? registerName.value.trim()
            : "";

    const email =
        registerEmail
            ? registerEmail.value.trim()
            : "";

    const password =
        registerPassword
            ? registerPassword.value
            : "";

    if (!name) {

        showAuthError(
            registerError,
            "Please enter your name."
        );

        return;
    }

    if (!email) {

        showAuthError(
            registerError,
            "Please enter your email."
        );

        return;
    }

    if (password.length < 6) {

        showAuthError(
            registerError,
            "Password must be at least 6 characters."
        );

        return;
    }

    try {

        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        if (result.user) {

            await updateProfile(
                result.user,
                {
                    displayName: name
                }
            );
        }

        showToast(
            "Account created successfully!"
        );

        if (registerForm) {
            registerForm.reset();
        }

        closeAuth();

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        showAuthError(
            registerError,
            getFirebaseErrorMessage(error)
        );
    }
}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(event) {

    event.preventDefault();

    hideAuthError(loginError);

    const email =
        loginEmail
            ? loginEmail.value.trim()
            : "";

    const password =
        loginPassword
            ? loginPassword.value
            : "";

    if (!email || !password) {

        showAuthError(
            loginError,
            "Please enter your email and password."
        );

        return;
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        showToast(
            "Login successful!"
        );

        if (loginForm) {
            loginForm.reset();
        }

        closeAuth();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showAuthError(
            loginError,
            getFirebaseErrorMessage(error)
        );
    }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

    try {

        await signOut(auth);

        showToast(
            "You have been logged out."
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showToast(
            "Could not log out."
        );
    }
}


/* =====================================================
   FIREBASE ERROR MESSAGES
===================================================== */

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "No account exists with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your connection.";

        default:
            return (
                error.message ||
                "Authentication failed."
            );
    }
}


/* =====================================================
   AUTH MODAL
===================================================== */

function openAuthModal(mode = "login") {

    if (!authModal) {
        return;
    }

    authModal.classList.remove("hidden");

    document.body.classList.add(
        "modal-open"
    );

    switchAuthMode(mode);
}


function closeAuth() {

    if (!authModal) {
        return;
    }

    authModal.classList.add("hidden");

    document.body.classList.remove(
        "modal-open"
    );

    hideAuthError(loginError);

    hideAuthError(registerError);
}


function switchAuthMode(mode) {

    if (mode === "register") {

        if (loginForm) {
            loginForm.classList.add("hidden");
        }

        if (registerForm) {
            registerForm.classList.remove("hidden");
        }

        if (authTitle) {
            authTitle.textContent =
                "Create your URLify account";
        }

        if (authSubtitle) {
            authSubtitle.textContent =
                "Create an account to manage your links.";
        }

    } else {

        if (registerForm) {
            registerForm.classList.add("hidden");
        }

        if (loginForm) {
            loginForm.classList.remove("hidden");
        }

        if (authTitle) {
            authTitle.textContent =
                "Welcome back";
        }

        if (authSubtitle) {
            authSubtitle.textContent =
                "Login to manage your links.";
        }
    }

    hideAuthError(loginError);

    hideAuthError(registerError);
}


/* =====================================================
   BACKEND AUTH HEADER
===================================================== */

async function getAuthHeaders() {

    const user =
        auth.currentUser;

    if (!user) {
        throw new Error(
            "Please login first."
        );
    }

    const token =
        await user.getIdToken();

    return {
        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${token}`
    };
}


/* =====================================================
   LOAD LINKS
===================================================== */

async function loadHistoryFromBackend() {

    try {

        const headers =
            await getAuthHeaders();

        const response =
            await fetch(
                API_URL,
                {
                    method: "GET",
                    headers
                }
            );

        if (response.status === 401) {

            throw new Error(
                "Your session is no longer valid."
            );
        }

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const data =
            await response.json();

        history =
            Array.isArray(data)
                ? data.map(mapBackendLink)
                : [];

        renderHistory();

        updateStats();

    } catch (error) {

        console.error(
            "Load links error:",
            error
        );

        history = [];

        renderHistory();

        updateStats();

        showToast(
            error.message ||
            "Could not load your links."
        );
    }
}


/* =====================================================
   MAP BACKEND LINK
===================================================== */

function mapBackendLink(link) {

    return {

        id:
            link.id,

        originalUrl:
            link.original_url,

        shortCode:
            link.short_code,

        shortUrl:
            `${BACKEND_URL}/r/${encodeURIComponent(
                link.short_code
            )}`,

        clicks:
            Number(link.clicks) || 0,

        createdAt:
            link.created_at
    };
}


/* =====================================================
   ANALYTICS
===================================================== */

async function loadAnalytics() {

    try {

        const headers =
            await getAuthHeaders();

        const response =
            await fetch(
                `${BACKEND_URL}/api/analytics`,
                {
                    method: "GET",
                    headers
                }
            );

        if (!response.ok) {

            throw new Error(
                `Analytics request failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        if (totalLinks) {

            totalLinks.textContent =
                Number(data.total_links) || 0;
        }

        if (totalClicks) {

            totalClicks.textContent =
                Number(data.total_clicks) || 0;
        }

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

        updateStats();
    }
}


/* =====================================================
   SHORTEN URL
===================================================== */

async function shortenURL(event) {

    event.preventDefault();

    clearError();

    if (!urlInput || !aliasInput) {
        return;
    }

    const originalUrl =
        urlInput.value.trim();

    let alias =
        aliasInput.value.trim();

    if (!originalUrl) {

        showError(
            "Please enter a URL."
        );

        return;
    }

    try {

        const parsedUrl =
            new URL(originalUrl);

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            throw new Error();
        }

    } catch {

        showError(
            "Please enter a valid HTTP or HTTPS URL."
        );

        return;
    }

    if (alias) {

        alias =
            normalizeAliasValue(alias);

        if (!isValidAlias(alias)) {

            showError(
                "Invalid alias. Use 3–30 letters, numbers, hyphens or underscores."
            );

            return;
        }

    } else {

        alias =
            generateShortCode();
    }

    setLoading(true);

    try {

        const headers =
            await getAuthHeaders();

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers,

                    body: JSON.stringify({
                        original_url:
                            originalUrl,

                        short_code:
                            alias
                    })
                }
            );

        if (response.status === 409) {

            throw new Error(
                "That alias is already taken. Try another one."
            );
        }

        if (response.status === 401) {

            throw new Error(
                "Please login again."
            );
        }

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => null);

            throw new Error(
                errorData?.detail ||
                `Server returned ${response.status}`
            );
        }

        const data =
            await response.json();

        const mapped =
            mapBackendLink(data);

        history.unshift(mapped);

        currentShortUrl =
            mapped.shortUrl;

        showResult(mapped);

        renderHistory();

        updateStats();

        await loadAnalytics();

        shortenerForm.reset();

        updateAliasCounter();

        validateAliasLive();

        showToast(
            "Short URL created successfully!"
        );

    } catch (error) {

        console.error(
            "Shorten error:",
            error
        );

        showError(
            error.message ||
            "Could not create the short URL."
        );

    } finally {

        setLoading(false);
    }
}


/* =====================================================
   GENERATE SHORT CODE
===================================================== */

function generateShortCode() {

    const characters =
        "abcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < 7; i++) {

        result +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];
    }

    return result;
}


/* =====================================================
   ALIAS
===================================================== */

function normalizeAlias() {

    if (!aliasInput) {
        return;
    }

    aliasInput.value =
        normalizeAliasValue(
            aliasInput.value
        );
}


function normalizeAliasValue(value) {

    return String(value)
        .toLowerCase()
        .replace(
            /[^a-z0-9_-]/g,
            ""
        );
}


function isValidAlias(alias) {

    return /^[a-z0-9_-]{3,30}$/.test(
        alias
    );
}


function updateAliasCounter() {

    if (!aliasInput || !aliasCounter) {
        return;
    }

    const length =
        aliasInput.value.length;

    aliasCounter.textContent =
        `${length}/30`;
}


function validateAliasLive() {

    if (
        !aliasInput ||
        !aliasStatus ||
        !aliasMessage
    ) {
        return;
    }

    const alias =
        aliasInput.value.trim();

    aliasStatus.className =
        "alias-status";

    aliasStatus.textContent = "";

    if (!alias) {

        aliasMessage.textContent =
            "Use letters, numbers, hyphens or underscores.";

        return;
    }

    if (isValidAlias(alias)) {

        aliasStatus.textContent =
            "✓ Alias format looks good.";

        aliasStatus.classList.add(
            "valid"
        );

        aliasMessage.textContent =
            "This alias will be used as your short link.";

    } else {

        aliasStatus.textContent =
            "✕ Invalid alias.";

        aliasStatus.classList.add(
            "invalid"
        );

        aliasMessage.textContent =
            "Use 3–30 letters, numbers, hyphens or underscores.";
    }
}


/* =====================================================
   RESULT
===================================================== */

function showResult(link) {

    if (resultCard) {
        resultCard.classList.remove(
            "hidden"
        );
    }

    currentShortUrl =
        link.shortUrl;

    if (shortUrl) {

        shortUrl.textContent =
            link.shortUrl;

        shortUrl.href =
            link.shortUrl;
    }

    if (qrContainer) {
        qrContainer.classList.add(
            "hidden"
        );
    }

    if (qrcode) {
        qrcode.innerHTML = "";
    }
}


/* =====================================================
   COPY
===================================================== */

async function copyShortUrl() {

    if (!currentShortUrl) {
        return;
    }

    try {

        await copyText(
            currentShortUrl
        );

        showToast(
            "Short URL copied!"
        );

    } catch {

        showToast(
            "Could not copy URL."
        );
    }
}


/* =====================================================
   COPY HELPER
===================================================== */

async function copyText(text) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            text
        );

        return;
    }

    const textarea =
        document.createElement("textarea");

    textarea.value = text;

    textarea.style.position =
        "fixed";

    textarea.style.opacity =
        "0";

    document.body.appendChild(
        textarea
    );

    textarea.select();

    const successful =
        document.execCommand("copy");

    textarea.remove();

    if (!successful) {
        throw new Error(
            "Copy failed"
        );
    }
}


/* =====================================================
   OPEN
===================================================== */

function openShortUrl() {

    if (!currentShortUrl) {
        return;
    }

    window.open(
        currentShortUrl,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =====================================================
   QR CODE
===================================================== */

function toggleQr() {

    if (
        !currentShortUrl ||
        !qrContainer ||
        !qrcode
    ) {
        return;
    }

    if (
        qrContainer.classList.contains(
            "hidden"
        )
    ) {

        qrContainer.classList.remove(
            "hidden"
        );

        qrcode.innerHTML = "";

        if (
            typeof QRCode ===
            "undefined"
        ) {

            showToast(
                "QR Code library is not loaded."
            );

            return;
        }

        new QRCode(
            qrcode,
            {
                text:
                    currentShortUrl,

                width:
                    180,

                height:
                    180,

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );

    } else {

        qrContainer.classList.add(
            "hidden"
        );
    }
}


/* =====================================================
   DOWNLOAD QR
===================================================== */

function downloadQr() {

    if (!qrcode) {
        return;
    }

    const canvas =
        qrcode.querySelector(
            "canvas"
        );

    const image =
        qrcode.querySelector(
            "img"
        );

    if (canvas) {

        const link =
            document.createElement("a");

        link.download =
            "urlify-qr.png";

        link.href =
            canvas.toDataURL(
                "image/png"
            );

        link.click();

        showToast(
            "QR code downloaded!"
        );

        return;
    }

    if (image) {

        const link =
            document.createElement("a");

        link.download =
            "urlify-qr.png";

        link.href =
            image.src;

        link.click();

        showToast(
            "QR code downloaded!"
        );

        return;
    }

    showToast(
        "Generate the QR code first."
    );
}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

    if (
        !historyList ||
        !emptyHistory
    ) {
        return;
    }

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const filtered =
        history.filter(item => {

            const code =
                String(
                    item.shortCode || ""
                ).toLowerCase();

            const original =
                String(
                    item.originalUrl || ""
                ).toLowerCase();

            return (
                code.includes(search) ||
                original.includes(search)
            );
        });

    historyList.innerHTML = "";

    if (filtered.length === 0) {

        emptyHistory.classList.remove(
            "hidden"
        );

        if (history.length > 0 && search) {

            const heading =
                emptyHistory.querySelector("h3");

            const paragraph =
                emptyHistory.querySelector("p");

            if (heading) {
                heading.textContent =
                    "No matching links";
            }

            if (paragraph) {
                paragraph.textContent =
                    "Try a different search term.";
            }

        } else {

            const heading =
                emptyHistory.querySelector("h3");

            const paragraph =
                emptyHistory.querySelector("p");

            if (heading) {
                heading.textContent =
                    "No links yet";
            }

            if (paragraph) {
                paragraph.textContent =
                    "Create your first short URL and it will appear here.";
            }
        }

        return;
    }

    emptyHistory.classList.add(
        "hidden"
    );

    filtered.forEach(item => {

        const element =
            document.createElement(
                "article"
            );

        element.className =
            "history-item";

        element.innerHTML = `

            <div class="history-info">

                <a
                    href="${escapeHTML(item.shortUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="history-short"
                >
                    ${escapeHTML(item.shortUrl)}
                </a>

                <p class="history-original">
                    ${escapeHTML(item.originalUrl)}
                </p>

                <div class="history-meta">

                    <span>
                        👆 ${Number(item.clicks) || 0} clicks
                    </span>

                    <span>
                        ${formatDate(item.createdAt)}
                    </span>

                </div>

            </div>

            <div class="history-item-actions">

                <button
                    class="small-action"
                    data-action="copy"
                    data-code="${escapeHTML(item.shortCode)}"
                    type="button"
                >
                    Copy
                </button>

                <button
                    class="small-action"
                    data-action="open"
                    data-code="${escapeHTML(item.shortCode)}"
                    type="button"
                >
                    Open
                </button>

                <button
                    class="small-action delete-action"
                    data-action="delete"
                    data-code="${escapeHTML(item.shortCode)}"
                    type="button"
                >
                    Delete
                </button>

            </div>
        `;

        historyList.appendChild(
            element
        );
    });

    historyList
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                handleHistoryAction
            );
        });
}


/* =====================================================
   HISTORY ACTION
===================================================== */

async function handleHistoryAction(event) {

    const button =
        event.currentTarget;

    const action =
        button.dataset.action;

    const code =
        button.dataset.code;

    const item =
        history.find(
            link =>
                link.shortCode === code
        );

    if (!item) {
        return;
    }

    if (action === "copy") {

        try {

            await copyText(
                item.shortUrl
            );

            showToast(
                "Link copied!"
            );

        } catch {

            showToast(
                "Could not copy link."
            );
        }
    }

    if (action === "open") {

        window.open(
            item.shortUrl,
            "_blank",
            "noopener,noreferrer"
        );
    }

    if (action === "delete") {

        await deleteLink(
            code
        );
    }
}


/* =====================================================
   DELETE
===================================================== */

async function deleteLink(shortCode) {

    try {

        const headers =
            await getAuthHeaders();

        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(
                    shortCode
                )}`,
                {
                    method: "DELETE",
                    headers
                }
            );

        if (response.status === 401) {

            throw new Error(
                "Please login again."
            );
        }

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => null);

            throw new Error(
                errorData?.detail ||
                "Could not delete link."
            );
        }

        history =
            history.filter(
                item =>
                    item.shortCode !==
                    shortCode
            );

        renderHistory();

        updateStats();

        await loadAnalytics();

        showToast(
            "Link deleted."
        );

    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        showToast(
            error.message ||
            "Could not delete link."
        );
    }
}


/* =====================================================
   CLEAR ALL
===================================================== */

function openClearModal() {

    if (history.length === 0) {

        showToast(
            "There are no links to delete."
        );

        return;
    }

    if (clearModal) {

        clearModal.classList.remove(
            "hidden"
        );

        document.body.classList.add(
            "modal-open"
        );
    }
}


function closeClearModal() {

    if (clearModal) {

        clearModal.classList.add(
            "hidden"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }
}


async function clearAllLinks() {

    if (history.length === 0) {

        closeClearModal();

        return;
    }

    try {

        const headers =
            await getAuthHeaders();

        const links =
            [...history];

        if (confirmClear) {
            confirmClear.disabled = true;
        }

        for (const link of links) {

            const response =
                await fetch(
                    `${API_URL}/${encodeURIComponent(
                        link.shortCode
                    )}`,
                    {
                        method: "DELETE",
                        headers
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Could not delete ${link.shortCode}`
                );
            }
        }

        history = [];

        renderHistory();

        updateStats();

        await loadAnalytics();

        closeClearModal();

        showToast(
            "All links deleted."
        );

    } catch (error) {

        console.error(
            "Clear all error:",
            error
        );

        showToast(
            error.message ||
            "Could not clear all links."
        );

    } finally {

        if (confirmClear) {
            confirmClear.disabled = false;
        }
    }
}


/* =====================================================
   EXPORT CSV
===================================================== */

function exportCSV() {

    if (history.length === 0) {

        showToast(
            "There are no links to export."
        );

        return;
    }

    let csv =
        "Short URL,Original URL,Clicks,Created At\n";

    history.forEach(item => {

        csv +=
            `"${escapeCSV(item.shortUrl)}",` +
            `"${escapeCSV(item.originalUrl)}",` +
            `"${Number(item.clicks) || 0}",` +
            `"${escapeCSV(
                formatDate(item.createdAt)
            )}"\n`;
    });

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        "urlify-links.csv";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "CSV exported successfully!"
    );
}


function escapeCSV(value) {

    return String(value)
        .replace(
            /"/g,
            '""'
        );
}


/* =====================================================
   STATS
===================================================== */

function updateStats() {

    if (totalLinks) {

        totalLinks.textContent =
            history.length;
    }

    const today =
        new Date();

    const todayString =
        today.toDateString();

    const todayCount =
        history.filter(item => {

            const created =
                new Date(
                    item.createdAt
                );

            return (
                !Number.isNaN(
                    created.getTime()
                ) &&
                created.toDateString() ===
                    todayString
            );

        }).length;

    if (todayLinks) {

        todayLinks.textContent =
            todayCount;
    }

    const clicks =
        history.reduce(
            (total, item) =>
                total +
                (Number(item.clicks) || 0),
            0
        );

    if (totalClicks) {

        totalClicks.textContent =
            clicks;
    }
}


/* =====================================================
   DATE
===================================================== */

function formatDate(date) {

    if (!date) {
        return "Unknown date";
    }

    const value =
        new Date(date);

    if (
        Number.isNaN(
            value.getTime()
        )
    ) {
        return "Unknown date";
    }

    return value.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =====================================================
   LOADING
===================================================== */

function setLoading(loading) {

    if (shortenBtn) {

        shortenBtn.disabled =
            loading;
    }

    if (
        !shortenBtnText ||
        !shortenLoader
    ) {
        return;
    }

    if (loading) {

        shortenBtnText.classList.add(
            "hidden"
        );

        shortenLoader.classList.remove(
            "hidden"
        );

    } else {

        shortenBtnText.classList.remove(
            "hidden"
        );

        shortenLoader.classList.add(
            "hidden"
        );
    }
}


/* =====================================================
   ERROR
===================================================== */

function showError(message) {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function clearError() {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = "";

    errorMessage.classList.add(
        "hidden"
    );
}


function showAuthError(
    element,
    message
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.classList.remove(
        "hidden"
    );
}


function hideAuthError(element) {

    if (!element) {
        return;
    }

    element.textContent = "";

    element.classList.add(
        "hidden"
    );
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    if (!toast) {
        return;
    }

    clearTimeout(
        toastTimer
    );

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =====================================================
   THEME
===================================================== */

function loadTheme() {

    const saved =
        localStorage.getItem(
            "urlify-theme"
        );

    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

        if (themeBtn) {

            themeBtn.textContent =
                "☀️";

            themeBtn.title =
                "Switch to light mode";
        }

    } else {

        document.body.classList.remove(
            "dark"
        );

        if (themeBtn) {

            themeBtn.textContent =
                "🌙";

            themeBtn.title =
                "Switch to dark mode";
        }
    }
}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );

    const dark =
        document.body.classList.contains(
            "dark"
        );

    localStorage.setItem(
        "urlify-theme",
        dark
            ? "dark"
            : "light"
    );

    if (themeBtn) {

        themeBtn.textContent =
            dark
                ? "☀️"
                : "🌙";

        themeBtn.title =
            dark
                ? "Switch to light mode"
                : "Switch to dark mode";
    }
}