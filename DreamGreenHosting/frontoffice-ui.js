console.log("Front Office UI Loaded");

// Show Back Office button only for full-access users
function showAdminButtonIfNeeded() {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    console.log("isAdmin:", isAdmin);

    if (!isAdmin) return;

    const headerRight = document.getElementById("header-right");
    if (!headerRight) return;

    headerRight.innerHTML = `
        <button id="backoffice-btn" class="login-btn">Back Office</button>
    `;

    document.getElementById("backoffice-btn").addEventListener("click", () => {
        window.location.href = "backoffice.html";
    });
}

// Run on page load
showAdminButtonIfNeeded();
