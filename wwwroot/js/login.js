"use strict";

/* =========================================================
   CHT MANAGEMENT SYSTEM
   LOGIN PAGE LOGIC
   ========================================================= */


/* ---------- Existing Session Check ---------- */

const existingToken = sessionStorage.getItem("token");

if (existingToken) {
    window.location.replace("/pages/dashboard.html");
}


/* ---------- Elements ---------- */

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const passwordToggle = document.getElementById("passwordToggle");
const forgotPassword = document.getElementById("forgotPassword");


/* ---------- Password Visibility ---------- */

passwordToggle.addEventListener("click", function () {

    const isPassword =
        passwordInput.type === "password";

    passwordInput.type =
        isPassword ? "text" : "password";

    passwordToggle.setAttribute(
        "aria-label",
        isPassword
            ? "Hide password"
            : "Show password"
    );
});


/* ---------- Login ---------- */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    clearMessage();

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    /* Basic client-side validation */

    if (!username) {
        showMessage("Please enter your username.");
        usernameInput.focus();
        return;
    }

    if (!password) {
        showMessage("Please enter your password.");
        passwordInput.focus();
        return;
    }


    /* Loading state */

    setLoading(true);


    try {

        const response = await fetch("/api/Auth/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        });


        let data = null;

        try {
            data = await response.json();
        }
        catch {
            data = null;
        }


        /* Login failed */

        if (!response.ok) {

            showMessage(
                data?.message ||
                "Invalid username or password."
            );

            setLoading(false);

            return;
        }


        /* Token missing */

        if (!data?.token) {

            showMessage(
                "Login failed. Authentication token was not received."
            );

            setLoading(false);

            return;
        }


        /* Store authentication data */

        sessionStorage.setItem(
            "token",
            data.token
        );

        sessionStorage.setItem(
            "username",
            data.username || username
        );

        sessionStorage.setItem(
            "role",
            data.role || ""
        );


        /* Redirect */

        window.location.replace(
            "/pages/dashboard.html"
        );

    }
    catch (error) {

        console.error(
            "Login error:",
            error
        );

        showMessage(
            "Unable to connect to the server. Please try again."
        );

        setLoading(false);
    }

});


/* ---------- Forgot Password ---------- */

forgotPassword.addEventListener("click", function () {

    showMessage(
        "Please contact the system administrator for password assistance."
    );

});


/* ---------- Helpers ---------- */

function showMessage(message) {

    loginMessage.textContent = message;
}


function clearMessage() {

    loginMessage.textContent = "";
}


function setLoading(isLoading) {

    loginButton.disabled = isLoading;

    loginButton.classList.toggle(
        "loading",
        isLoading
    );
}