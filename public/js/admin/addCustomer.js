document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const secondaryEmailInput = document.getElementById("secondaryEmail");
    const phoneInput = document.getElementById("phoneNumber");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("password-confirm");

    const showError = (input, message) => {
        const errorContainer = input.nextElementSibling;
        errorContainer.textContent = message;
    };

    const clearError = (input) => {
        const errorContainer = input.nextElementSibling;
        errorContainer.textContent = "";
    };

    const validateField = (input, validator, message) => {
        if (!validator(input.value.trim())) {
            showError(input, message);
            return false;
        }
        clearError(input);
        return true;
    };

    const validators = {
        name: value => /^[A-Za-z\s]+$/.test(value),
        email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: value => /^[0-9]{10}$/.test(value),
        password: value => value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value),
        confirmPassword: value => value === passwordInput.value
    };

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const validations = [
            validateField(nameInput, validators.name, "Name is required and must only contain letters."),
            validateField(emailInput, validators.email, "Enter a valid email address."),
            validateField(secondaryEmailInput, validators.email, "Enter a valid email address."),
            validateField(phoneInput, validators.phone, "Enter a valid 10-digit phone number."),
            validateField(passwordInput, validators.password, "Password must be at least 8 characters long and include letters and numbers."),
            validateField(confirmPasswordInput, validators.confirmPassword, "Passwords do not match.")
        ];

        if (validations.every(Boolean)) {
            form.submit();
        }
    });
});
window.onload = function () {
    const alertMessage = document.getElementById("alertMessage");
    if (alertMessage) {
        setTimeout(() => {
            alertMessage.classList.remove("show");
            alertMessage.classList.add("d-none");
            alertMessage.innerText = ""
        }, 4000);
    }
};