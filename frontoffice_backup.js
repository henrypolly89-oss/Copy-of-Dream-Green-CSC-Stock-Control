console.log("JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    // Default PIN (can be changed in Back Office)
    let ADMIN_PIN = "1234";

    // Load stored PIN if changed
    const storedPin = localStorage.getItem("admin_pin");
    if (storedPin) {
        ADMIN_PIN = storedPin;
    }

    // DOM elements
    const staffLoginBtn = document.getElementById("staff-login-btn");
    const pinOverlay = document.getElementById("pin-modal-overlay");
    const pinInput = document.getElementById("pin-input");
    const pinError = document.getElementById("pin-error");
    const pinSubmitBtn = document.getElementById("pin-submit-btn");
    const pinCancelBtn = document.getElementById("pin-cancel-btn");

    // Show modal
    staffLoginBtn.addEventListener("click", () => {
        pinOverlay.style.display = "flex";
        pinInput.value = "";
        pinError.textContent = "";
        pinInput.focus();
    });

    // Hide modal
    pinCancelBtn.addEventListener("click", () => {
        pinOverlay.style.display = "none";
    });

    // Submit PIN
    pinSubmitBtn.addEventListener("click", checkPin);
    pinInput.addEventListener("keydown", e => {
        if (e.key === "Enter") checkPin();
    });

    // Check PIN
    function checkPin() {
        const entered = pinInput.value.trim();
        if (entered === ADMIN_PIN) {
            window.location.href = "backoffice.html";
        } else {
            pinError.textContent = "Incorrect PIN";
            pinInput.value = "";
            pinInput.focus();
        }
    }

});
