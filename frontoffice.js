// FRONT OFFICE LOGIN — FIREBASE v8.10.1

document.addEventListener("DOMContentLoaded", function () {
    console.log("Frontoffice JS running (v8)");

    // ===============================
    // FIREBASE INIT
    // ===============================
    var firebaseConfig = {
        apiKey: "YOUR_KEY",
        authDomain: "backoffice-inventory.firebaseapp.com",
        projectId: "backoffice-inventory",
        storageBucket: "backoffice-inventory.appspot.com",
        messagingSenderId: "YOUR_ID",
        appId: "YOUR_APP_ID"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    console.log("Frontoffice Login Loaded");

    // ===============================
    // LOGIN MODAL ELEMENTS
    // ===============================
    const loginBtn = document.getElementById("user-login-btn");
    const overlay = document.getElementById("login-modal-overlay");
    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("password-input");
    const loginError = document.getElementById("login-error");
    const loginSubmitBtn = document.getElementById("login-submit-btn");
    const loginCancelBtn = document.getElementById("login-cancel-btn");

    // ===============================
    // OPEN LOGIN MODAL
    // ===============================
    loginBtn.addEventListener("click", () => {
        overlay.style.display = "flex";
        usernameInput.value = "";
        passwordInput.value = "";
        loginError.textContent = "";
        usernameInput.focus();
    });

    // ===============================
    // CLOSE LOGIN MODAL
    // ===============================
    loginCancelBtn.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    // ===============================
    // LOGIN SUBMIT HANDLERS
    // ===============================
    loginSubmitBtn.addEventListener("click", loginUser);
    passwordInput.addEventListener("keydown", e => {
        if (e.key === "Enter") loginUser();
    });

    // ===============================
    // LOGIN FUNCTION
    // ===============================
    function loginUser() {
        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            loginError.textContent = "Enter username and password";
            return;
        }

        db.collection("users").doc(username).get().then(doc => {
            if (!doc.exists) {
                loginError.textContent = "User not found";
                return;
            }

            const data = doc.data();

            if (password !== data.password) {
                loginError.textContent = "Incorrect password";
                return;
            }

            // Save logged-in user
            sessionStorage.setItem("loggedInUser", username);

            // Force password change?
            if (data.mustChangePassword === true) {
                window.location.href = "change-password.html";
                return;
            }

// Store admin status for later
if (data.role === "full") {
    sessionStorage.setItem("isAdmin", "true");
} else {
    sessionStorage.setItem("isAdmin", "false");
}


// After successful login, always go to the main Front Office page
window.location.replace("index.html");




            // Update last login
            db.collection("users").doc(username).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

        }).catch(err => {
            console.error("Login error:", err);
            loginError.textContent = "Error connecting to server";
        });
    }

    function showAdminButtonIfNeeded() {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    if (!isAdmin) return;

    const headerRight = document.getElementById("header-right");
    if (!headerRight) return;

    headerRight.innerHTML = `
        <button id="backoffice-btn">Back Office</button>
    `;

    document.getElementById("backoffice-btn").addEventListener("click", () => {
        window.location.href = "backoffice.html";
    });
}
    showAdminButtonIfNeeded();
});


