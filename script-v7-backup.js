/* =====================================================
   URLIFY V7
   ===================================================== */


/* =====================================================
   API
   ===================================================== */

const API_URL =
    "http://127.0.0.1:8000/api/links";

const BACKEND_URL =
    "http://127.0.0.1:8000";


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

// URL input
const urlInput =
    document.getElementById("urlInput");

// Alias
const aliasInput =
    document.getElementById("aliasInput");

const aliasCounter =
    document.getElementById("aliasCounter");

const aliasStatus =
    document.getElementById("aliasStatus");

const aliasMessage =
    document.getElementById("aliasMessage");

// Shorten button
const shortenBtn =
    document.getElementById("shortenBtn");

const buttonIcon =
    document.getElementById("buttonIcon");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");

// Error
const errorMessage =
    document.getElementById("errorMessage");

// Result
const result =
    document.getElementById("result");

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

// Stats
const totalLinks =
    document.getElementById("totalLinks");

const todayLinks =
    document.getElementById("todayLinks");

// History
const historyList =
    document.getElementById("historyList");

const emptyHistory =
    document.getElementById("emptyHistory");

const clearBtn =
    document.getElementById("clearBtn");

const exportBtn =
    document.getElementById("exportBtn");

const searchInput =
    document.getElementById("searchInput");

// Theme
const themeBtn =
    document.getElementById("themeBtn");

// Toast
const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastMessage =
    document.getElementById("toastMessage");

// Custom confirmation modal
const confirmModal =
    document.getElementById("confirmModal");

const cancelClearBtn =
    document.getElementById("cancelClearBtn");

const confirmClearBtn =
    document.getElementById("confirmClearBtn");


/* =====================================================
   STATE
   ===================================================== */

let history = [];

let currentShortUrl = "";

let toastTimer;


/* =====================================================
   LOAD HISTORY FROM LOCAL STORAGE
   ===================================================== */

try {

    history =
        JSON.parse(
            localStorage.getItem("urlifyHistory")
        ) || [];

} catch (error) {

    console.error(
        "Could not load history:",
        error
    );

    history = [];

}


/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loadTheme();

        renderHistory();

        updateStats();

        updateAliasCounter();

        validateAliasLive();

        // Get latest click counts
        await refreshClickCounts();

    }
);


/* =====================================================
   THEME
   ===================================================== */

function loadTheme() {

    const savedTheme =
        localStorage.getItem("urlifyTheme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        themeBtn.textContent = "☀️";

    } else {

        themeBtn.textContent = "🌙";

    }

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        const darkMode =
            document.body.classList.contains(
                "dark"
            );

        localStorage.setItem(
            "urlifyTheme",
            darkMode ? "dark" : "light"
        );

        themeBtn.textContent =
            darkMode
                ? "☀️"
                : "🌙";

    }
);


/* =====================================================
   ALIAS INPUT
   ===================================================== */

aliasInput.addEventListener(
    "input",
    () => {

        let value =
            aliasInput.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

        aliasInput.value =
            value;

        updateAliasCounter();

        validateAliasLive();

    }
);


/* =====================================================
   ALIAS COUNTER
   ===================================================== */

function updateAliasCounter() {

    aliasCounter.textContent =
        `${aliasInput.value.length}/16`;

}


/* =====================================================
   LIVE ALIAS VALIDATION
   ===================================================== */

function validateAliasLive() {

    const alias =
        aliasInput.value.trim();

    aliasStatus.className =
        "alias-status";

    // Empty alias is allowed

    if (alias === "") {

        aliasStatus.textContent = "";

        aliasMessage.textContent =
            "5–16 characters. Use letters, numbers and hyphens.";

        return true;

    }

    // Too short

    if (alias.length < 5) {

        aliasStatus.classList.add(
            "invalid"
        );

        aliasStatus.textContent =
            "✕ Too short";

        aliasMessage.textContent =
            "Your alias must contain at least 5 characters.";

        return false;

    }

    // Too long

    if (alias.length > 16) {

        aliasStatus.classList.add(
            "invalid"
        );

        aliasStatus.textContent =
            "✕ Too long";

        aliasMessage.textContent =
            "Your alias must not exceed 16 characters.";

        return false;

    }

    /*
       First and last character:
       letter or number

       Middle:
       letters, numbers or hyphen
    */

    const pattern =
        /^[a-z0-9](?:[a-z0-9-]{3,14})[a-z0-9]$/;

    if (!pattern.test(alias)) {

        aliasStatus.classList.add(
            "invalid"
        );

        aliasStatus.textContent =
            "✕ Invalid alias";

        aliasMessage.textContent =
            "Use only letters, numbers and hyphens. Start and end with a letter or number.";

        return false;

    }

    // Valid

    aliasStatus.classList.add(
        "valid"
    );

    aliasStatus.textContent =
        "✓ Valid alias";

    aliasMessage.textContent =
        "This alias can be used when creating your link.";

    return true;

}


/* =====================================================
   SHORTEN BUTTON
   ===================================================== */

shortenBtn.addEventListener(
    "click",
    shortenURL
);


/* =====================================================
   SHORTEN URL
   ===================================================== */

async function shortenURL() {

    clearError();

    const longURL =
        urlInput.value.trim();

    const alias =
        aliasInput.value.trim();


    /* =================================================
       URL VALIDATION
       ================================================= */

    if (!longURL) {

        showError(
            "Please enter a URL."
        );

        urlInput.focus();

        return;

    }


    let parsedURL;

    try {

        parsedURL =
            new URL(longURL);

    } catch (error) {

        showError(
            "Please enter a valid URL."
        );

        urlInput.focus();

        return;

    }


    // Only HTTP and HTTPS

    if (
        parsedURL.protocol !== "http:" &&
        parsedURL.protocol !== "https:"
    ) {

        showError(
            "Only HTTP and HTTPS URLs are supported."
        );

        return;

    }


    /* =================================================
       ALIAS VALIDATION
       ================================================= */

    if (
        alias &&
        !validateAliasLive()
    ) {

        showError(
            "Please fix your custom alias."
        );

        aliasInput.focus();

        return;

    }


    /* =================================================
       GENERATE SHORT CODE
       ================================================= */

    let shortCode =
        alias;

    if (!shortCode) {

        shortCode =
            generateShortCode(6);

    }


    /* =================================================
       START LOADING
       ================================================= */

    setLoading(true);


    try {

        /* =================================================
           REQUEST BODY
           ================================================= */

        const requestBody = {

            original_url:
                longURL,

            short_code:
                shortCode

        };


        /* =================================================
           API REQUEST
           ================================================= */

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );


        /* =================================================
           API RESPONSE
           ================================================= */

        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }


        /* =================================================
           ALIAS ALREADY TAKEN
           ================================================= */

        if (
            response.status === 409
        ) {

            throw new Error(
                "That custom alias is already taken. Please choose another one."
            );

        }


        /* =================================================
           VALIDATION ERROR
           ================================================= */

        if (
            response.status === 422
        ) {

            let message =
                "The URL or alias is invalid.";

            if (Array.isArray(data.detail)) {

                message =
                    data.detail
                        .map(
                            error =>
                                error.msg
                        )
                        .join(", ");

            } else if (data.detail) {

                message =
                    data.detail;

            }

            throw new Error(
                message
            );

        }


        /* =================================================
           OTHER ERRORS
           ================================================= */

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to create the short URL."
            );

        }


        /* =================================================
           CHECK RESPONSE
           ================================================= */

        if (!data.short_code) {

            throw new Error(
                "The backend did not return a short code."
            );

        }


        /* =================================================
           BUILD REAL SHORT URL
           ================================================= */

        const shortenedURL =
            `${BACKEND_URL}/r/${data.short_code}`;


        /* =================================================
           SAVE CURRENT URL
           ================================================= */

        currentShortUrl =
            shortenedURL;


        /* =================================================
           DISPLAY RESULT
           ================================================= */

        displayResult(
            shortenedURL
        );


        /* =================================================
           SAVE TO HISTORY
           ================================================= */

        saveHistory({

            id:
                data.id ||
                Date.now(),

            originalUrl:
                data.original_url ||
                longURL,

            shortUrl:
                shortenedURL,

            alias:
                data.short_code,

            createdAt:
                data.created_at ||
                new Date().toISOString(),

            clicks:
                data.clicks || 0

        });


        /* =================================================
           SUCCESS MESSAGE
           ================================================= */

        showToast(
            "success",
            "URL shortened successfully!"
        );


        /* =================================================
           RESET INPUTS
           ================================================= */

        urlInput.value = "";

        aliasInput.value = "";

        updateAliasCounter();

        validateAliasLive();


    } catch (error) {

        console.error(
            "Shortening error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong. Please try again."
        );


        showToast(
            "error",
            "Could not shorten URL."
        );


    } finally {

        setLoading(false);

    }

}


/* =====================================================
   GENERATE RANDOM SHORT CODE
   ===================================================== */

function generateShortCode(
    length = 6
) {

    const characters =
        "abcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (
        let i = 0;
        i < length;
        i++
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                characters.length
            );

        result +=
            characters[randomIndex];

    }

    return result;

}


/* =====================================================
   DISPLAY RESULT
   ===================================================== */

function displayResult(url) {

    shortUrl.href =
        url;

    shortUrl.textContent =
        url;

    result.classList.remove(
        "hidden"
    );

    qrContainer.classList.add(
        "hidden"
    );

    qrcode.innerHTML =
        "";

    createQRCode(
        url
    );

}


/* =====================================================
   CREATE QR CODE
   ===================================================== */

function createQRCode(url) {

    if (
        typeof QRCode === "undefined"
    ) {

        console.error(
            "QRCode library not loaded."
        );

        return;

    }

    new QRCode(
        qrcode,
        {

            text:
                url,

            width:
                180,

            height:
                180,

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );

}


/* =====================================================
   QR BUTTON
   ===================================================== */

qrBtn.addEventListener(
    "click",
    () => {

        if (!currentShortUrl) {

            return;

        }

        qrContainer.classList.toggle(
            "hidden"
        );

        if (
            !qrContainer.classList.contains(
                "hidden"
            )
        ) {

            showToast(
                "success",
                "QR code generated."
            );

        }

    }
);


/* =====================================================
   DOWNLOAD QR CODE
   ===================================================== */

downloadQrBtn.addEventListener(
    "click",
    () => {

        const canvas =
            qrcode.querySelector(
                "canvas"
            );

        const image =
            qrcode.querySelector(
                "img"
            );

        let dataURL;


        // Canvas

        if (canvas) {

            dataURL =
                canvas.toDataURL(
                    "image/png"
                );

        }

        // Image fallback

        else if (image) {

            dataURL =
                image.src;

        }

        // Nothing found

        else {

            showToast(
                "error",
                "QR code is not ready."
            );

            return;

        }


        const link =
            document.createElement(
                "a"
            );

        link.href =
            dataURL;

        link.download =
            "urlify-qr-code.png";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        showToast(
            "success",
            "QR code downloaded."
        );

    }
);


/* =====================================================
   COPY CURRENT SHORT URL
   ===================================================== */

copyBtn.addEventListener(
    "click",
    async () => {

        if (!currentShortUrl) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                currentShortUrl
            );

        } catch (error) {

            fallbackCopy(
                currentShortUrl
            );

        }


        copyBtn.classList.add(
            "copied"
        );

        copyBtn.innerHTML =
            "✓ <span>Copied!</span>";


        showToast(
            "success",
            "Short URL copied."
        );


        setTimeout(
            () => {

                copyBtn.classList.remove(
                    "copied"
                );

                copyBtn.innerHTML =
                    "📋 <span>Copy</span>";

            },
            1800
        );

    }
);


/* =====================================================
   FALLBACK COPY
   ===================================================== */

function fallbackCopy(text) {

    const textarea =
        document.createElement(
            "textarea"
        );

    textarea.value =
        text;

    textarea.style.position =
        "fixed";

    textarea.style.opacity =
        "0";

    document.body.appendChild(
        textarea
    );

    textarea.select();

    document.execCommand(
        "copy"
    );

    textarea.remove();

}


/* =====================================================
   OPEN CURRENT SHORT URL
   ===================================================== */

openBtn.addEventListener(
    "click",
    () => {

        if (!currentShortUrl) {

            return;

        }


        window.open(
            currentShortUrl,
            "_blank",
            "noopener,noreferrer"
        );


        /*
           Give the browser a moment to follow
           the redirect, then refresh clicks.
        */

        setTimeout(
            refreshClickCounts,
            1000
        );

    }
);


/* =====================================================
   SAVE HISTORY
   ===================================================== */

function saveHistory(item) {

    history.unshift(
        item
    );


    // Keep maximum 50 links

    if (
        history.length > 50
    ) {

        history =
            history.slice(
                0,
                50
            );

    }


    localStorage.setItem(
        "urlifyHistory",
        JSON.stringify(history)
    );


    renderHistory();

    updateStats();

}


/* =====================================================
   REFRESH CLICK COUNTS FROM BACKEND
   ===================================================== */

async function refreshClickCounts() {

    /*
       If there is no history,
       there is nothing to update.
    */

    if (
        history.length === 0
    ) {

        return;

    }


    /*
       Request the latest information
       for every saved short URL.
    */

    for (
        const item of history
    ) {

        try {

            /*
               item.alias contains the
               backend short_code.
            */

            if (!item.alias) {

                continue;

            }


            const response =
                await fetch(
                    `${API_URL}/${encodeURIComponent(item.alias)}`
                );


            if (!response.ok) {

                continue;

            }


            const data =
                await response.json();


            /*
               Update local click count
               with backend value.
            */

            item.clicks =
                Number(data.clicks) || 0;


        } catch (error) {

            console.error(
                "Could not update click count:",
                error
            );

        }

    }


    /*
       Save updated click counts.
    */

    localStorage.setItem(
        "urlifyHistory",
        JSON.stringify(history)
    );


    /*
       Update the screen.
    */

    renderHistory();

}


/* =====================================================
   RENDER HISTORY
   ===================================================== */

function renderHistory() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    let filteredHistory =
        history;


    /* =================================================
       SEARCH FILTER
       ================================================= */

    if (search) {

        filteredHistory =
            history.filter(
                item => {

                    return (

                        item.shortUrl
                            .toLowerCase()
                            .includes(
                                search
                            )

                        ||

                        item.originalUrl
                            .toLowerCase()
                            .includes(
                                search
                            )

                        ||

                        (
                            item.alias || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            )

                    );

                }
            );

    }


    historyList.innerHTML =
        "";


    /* =================================================
       NO RESULTS
       ================================================= */

    if (
        filteredHistory.length === 0
    ) {

        emptyHistory.classList.remove(
            "hidden"
        );


        if (
            history.length > 0 &&
            search
        ) {

            emptyHistory.querySelector(
                "h3"
            ).textContent =
                "No matching links";


            emptyHistory.querySelector(
                "p"
            ).textContent =
                "Try another search term.";

        } else {

            emptyHistory.querySelector(
                "h3"
            ).textContent =
                "No links yet";


            emptyHistory.querySelector(
                "p"
            ).textContent =
                "Your shortened URLs will appear here.";

        }


        return;

    }


    /* =================================================
       HIDE EMPTY STATE
       ================================================= */

    emptyHistory.classList.add(
        "hidden"
    );


    /* =================================================
       CREATE HISTORY ITEMS
       ================================================= */

    filteredHistory.forEach(
        item => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "history-item";


            element.innerHTML = `

                <div class="history-main">

                    <a
                        href="${escapeHTML(item.shortUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="history-short"
                        data-history-id="${item.id}"
                    >
                        ${escapeHTML(item.shortUrl)}
                    </a>

                    <div
                        class="history-original"
                        title="${escapeHTML(item.originalUrl)}"
                    >
                        ${escapeHTML(item.originalUrl)}
                    </div>

                    <div class="history-date">
                        ${formatDate(item.createdAt)}
                        • ${item.clicks || 0} clicks
                    </div>

                </div>


                <div class="history-buttons">

                    <button
                        class="history-btn"
                        title="Copy"
                        data-action="copy"
                        data-id="${item.id}"
                    >
                        📋
                    </button>

                    <button
                        class="history-btn"
                        title="Open"
                        data-action="open"
                        data-id="${item.id}"
                    >
                        ↗
                    </button>

                    <button
                        class="history-btn delete"
                        title="Delete"
                        data-action="delete"
                        data-id="${item.id}"
                    >
                        🗑
                    </button>

                </div>

            `;


            historyList.appendChild(
                element
            );

        }
    );

}


/* =====================================================
   HISTORY LINK CLICK
   ===================================================== */

historyList.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                ".history-short"
            );


        if (!link) {

            return;

        }


        /*
           The browser will open the short URL normally.

           After the redirect happens, refresh the
           click count from the backend.
        */

        setTimeout(
            refreshClickCounts,
            1000
        );

    }
);


/* =====================================================
   HISTORY BUTTON ACTIONS
   ===================================================== */

historyList.addEventListener(
    "click",
    async event => {

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


        const item =
            history.find(
                link =>
                    link.id === id
            );


        if (!item) {

            return;

        }


        /* =================================================
           COPY
           ================================================= */

        if (
            action === "copy"
        ) {

            try {

                await navigator.clipboard.writeText(
                    item.shortUrl
                );

            } catch (error) {

                fallbackCopy(
                    item.shortUrl
                );

            }


            showToast(
                "success",
                "Short URL copied."
            );

        }


        /* =================================================
           OPEN
           ================================================= */

        if (
            action === "open"
        ) {

            window.open(
                item.shortUrl,
                "_blank",
                "noopener,noreferrer"
            );


            /*
               Wait for redirect and update
               backend click count.
            */

            setTimeout(
                refreshClickCounts,
                1000
            );

        }


        /* =================================================
           DELETE
           ================================================= */

        if (
            action === "delete"
        ) {

            deleteHistoryItem(
                id
            );

        }

    }
);


/* =====================================================
   DELETE ONE HISTORY ITEM
   ===================================================== */

function deleteHistoryItem(id) {

    const item =
        history.find(
            link =>
                link.id === id
        );


    /*
       Delete from backend as well.
    */

    if (
        item &&
        item.alias
    ) {

        fetch(
            `${API_URL}/${encodeURIComponent(item.alias)}`,
            {
                method: "DELETE"
            }
        ).catch(
            error => {

                console.error(
                    "Backend delete error:",
                    error
                );

            }
        );

    }


    history =
        history.filter(
            item =>
                item.id !== id
        );


    localStorage.setItem(
        "urlifyHistory",
        JSON.stringify(history)
    );


    renderHistory();

    updateStats();


    showToast(
        "success",
        "Link deleted."
    );

}


/* =====================================================
   CLEAR ALL — CUSTOM MODAL
   ===================================================== */

clearBtn.addEventListener(
    "click",
    () => {

        if (
            history.length === 0
        ) {

            showToast(
                "error",
                "There is no history to clear."
            );

            return;

        }


        confirmModal.classList.remove(
            "hidden"
        );

    }
);


/* =====================================================
   CANCEL CLEAR
   ===================================================== */

cancelClearBtn.addEventListener(
    "click",
    closeConfirmModal
);


/* =====================================================
   CONFIRM CLEAR
   ===================================================== */

confirmClearBtn.addEventListener(
    "click",
    async () => {

        /*
           Delete backend links.
        */

        const deleteRequests =
            history
                .filter(
                    item =>
                        item.alias
                )
                .map(
                    item =>
                        fetch(
                            `${API_URL}/${encodeURIComponent(item.alias)}`,
                            {
                                method: "DELETE"
                            }
                        ).catch(
                            error => {

                                console.error(
                                    "Delete error:",
                                    error
                                );

                            }
                        )
                );


        await Promise.all(
            deleteRequests
        );


        /* Delete local history */

        history = [];


        localStorage.removeItem(
            "urlifyHistory"
        );


        /* Update UI */

        renderHistory();

        updateStats();


        /* Close modal */

        closeConfirmModal();


        /* Success */

        showToast(
            "success",
            "All history cleared."
        );

    }
);


/* =====================================================
   CLOSE CONFIRMATION MODAL
   ===================================================== */

function closeConfirmModal() {

    confirmModal.classList.add(
        "hidden"
    );

}


/* =====================================================
   CLICK OUTSIDE MODAL
   ===================================================== */

confirmModal.addEventListener(
    "click",
    event => {

        if (
            event.target === confirmModal
        ) {

            closeConfirmModal();

        }

    }
);


/* =====================================================
   SEARCH
   ===================================================== */

searchInput.addEventListener(
    "input",
    renderHistory
);


/* =====================================================
   UPDATE STATISTICS
   ===================================================== */

function updateStats() {

    /* Total */

    totalLinks.textContent =
        history.length;


    /* Today's date */

    const today =
        new Date();


    const todayString =
        today.toDateString();


    /* Count today's links */

    const countToday =
        history.filter(
            item => {

                return (
                    new Date(
                        item.createdAt
                    ).toDateString()
                    ===
                    todayString
                );

            }
        ).length;


    todayLinks.textContent =
        countToday;

}


/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    return date.toLocaleString(
        undefined,
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =====================================================
   EXPORT HISTORY AS CSV
   ===================================================== */

exportBtn.addEventListener(
    "click",
    exportCSV
);


function exportCSV() {

    if (
        history.length === 0
    ) {

        showToast(
            "error",
            "No history to export."
        );

        return;

    }


    const headers = [

        "Short URL",

        "Original URL",

        "Custom Alias",

        "Created At",

        "Clicks"

    ];


    const rows =
        history.map(
            item => [

                item.shortUrl,

                item.originalUrl,

                item.alias || "",

                item.createdAt,

                item.clicks || 0

            ]
        );


    const csv = [

        headers,

        ...rows

    ]

        .map(
            row =>

                row

                    .map(
                        value =>
                            `"${String(value)
                                .replace(
                                    /"/g,
                                    '""'
                                )}"`
                    )

                    .join(",")

        )

        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "urlify-history.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "success",
        "History exported as CSV."
    );

}


/* =====================================================
   LOADING STATE
   ===================================================== */

function setLoading(
    isLoading
) {

    if (isLoading) {

        shortenBtn.classList.add(
            "loading"
        );


        buttonIcon.classList.add(
            "hidden"
        );


        buttonText.textContent =
            "Creating link...";


        loader.classList.remove(
            "hidden"
        );

    } else {

        shortenBtn.classList.remove(
            "loading"
        );


        buttonIcon.classList.remove(
            "hidden"
        );


        buttonIcon.textContent =
            "✨";


        buttonText.textContent =
            "Shorten URL";


        loader.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   SHOW ERROR
   ===================================================== */

function showError(
    message
) {

    errorMessage.textContent =
        "⚠ " + message;


    errorMessage.classList.remove(
        "hidden"
    );

}


/* =====================================================
   CLEAR ERROR
   ===================================================== */

function clearError() {

    errorMessage.textContent =
        "";


    errorMessage.classList.add(
        "hidden"
    );

}


/* =====================================================
   TOAST NOTIFICATION
   ===================================================== */

function showToast(
    type,
    message
) {

    clearTimeout(
        toastTimer
    );


    toastMessage.textContent =
        message;


    if (
        type === "error"
    ) {

        toastIcon.textContent =
            "⚠";


        toastIcon.style.color =
            "var(--danger)";


        toastIcon.style.background =
            "rgba(239,68,68,.12)";

    } else {

        toastIcon.textContent =
            "✓";


        toastIcon.style.color =
            "var(--success)";


        toastIcon.style.background =
            "rgba(34,197,94,.12)";

    }


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
            2500
        );

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHTML(
    value
) {

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
   KEYBOARD SHORTCUTS
   ===================================================== */

// Enter inside URL = Shorten

urlInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            shortenURL();

        }

    }
);


// Enter inside alias = Shorten

aliasInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            shortenURL();

        }

    }
);


// Escape = Clear error + close modal

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            clearError();

            closeConfirmModal();

        }

    }
);


/* =====================================================
   CTRL + K / CMD + K
   = FOCUS URL INPUT
   ===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            )
            &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            urlInput.focus();

        }

    }
);