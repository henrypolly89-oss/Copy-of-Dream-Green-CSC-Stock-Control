document.addEventListener("DOMContentLoaded", function () {
    console.log("Change Password JS Loaded");

    // Firebase init
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

    // Elements
    const oldPass = document.getElementById("old-password");
    const newPass = document.getElementById("new-password");
    const confirmPass = document.getElementById("confirm-password");
    const errorBox = document.getElementById("change-error");
    const changeBtn = document.getElementById("change-password-btn");

    // Logged-in user
    const username = sessionStorage.getItem("loggedInUser");

    if (!username) {
        errorBox.textContent = "Not logged in";
        return;
    }

    changeBtn.addEventListener("click", updatePassword);

    function updatePassword() {
        const oldVal = oldPass.value.trim();
        const newVal = newPass.value.trim();
        const confirmVal = confirmPass.value.trim();

        if (!oldVal || !newVal || !confirmVal) {
            errorBox.textContent = "Fill in all fields";
            return;
        }

        if (newVal !== confirmVal) {
            errorBox.textContent = "New passwords do not match";
            return;
        }

        db.collection("users").doc(username).get().then(doc => {
            if (!doc.exists) {
                errorBox.textContent = "User not found";
                return;
            }

            const data = doc.data();

            if (oldVal !== data.password) {
                errorBox.textContent = "Old password incorrect";
                return;
            }

            // Update password
            db.collection("users").doc(username).update({
                password: newVal,
                mustChangePassword: false
            }).then(() => {
                console.log("Password updated");

                // Redirect based on role
                if (data.role === "front") {
                    window.location.href = "frontoffice-dashboard.html";
                } else {
                    window.location.href = "backoffice.html";
                }
            });

        }).catch(err => {
            console.error("Error:", err);
            errorBox.textContent = "Error updating password";
        });
    }
});
