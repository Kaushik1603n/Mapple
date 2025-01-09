document.querySelector("form").onsubmit = function (event) {
    if (!validateForm()) {
        event.preventDefault(); 
    }
};

function validateForm() {
    clearErrorMessages();

    const category = document.getElementById("category").value.trim();
    const description = document.getElementById("description").value.trim();
    const status = document.getElementById("categoryStatus").value;
    let isValid = true;

    // Validate category
    if (!category) {
        displayErrorMessage("category-error", "Please enter a category name");
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(category)) {
        displayErrorMessage("category-error", "Category name should only contain letters");
        isValid = false;
    }

    // Validate description
    if (!description) {
        displayErrorMessage("description-error", "Please enter a description");
        isValid = false;
    }

    // Validate category status
    if (!status) {
        displayErrorMessage("status-error", "Please select a category status");
        isValid = false;
    }

    return isValid;
}

function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    errorElement.style.display = "block";
    errorElement.classList.add("text-danger");

    setTimeout(() => {
        errorElement.innerText = "";
        errorElement.style.display = "none";
    }, 4000);

}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((element) => {
        element.innerText = "";
        element.style.display = "none";
    });
}


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