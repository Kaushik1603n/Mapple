document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("accountForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach(function (msg) {
      msg.textContent = ""; // Clear all previous error messages
    });

    let formIsValid = true;

    const name = document.getElementById("name").value;
    const newemail = document.getElementById("newemail").value;
    // console.log(newemail);

    const secondaryEmail = document.getElementById("secondaryEmail").value;
    console.log("secon", secondaryEmail);

    const phone = document.getElementById("phoneNumber").value;

    if (name.trim() === "") {
      document.querySelector("#name + .error-message").textContent =
        "Full Name is required";
      formIsValid = false;
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (newemail.trim() === "") {
      document.querySelector("#email + .error-message").textContent =
        "Enter a valid email address";
      // alert("email requed")
      formIsValid = false;
    } else if (!emailPattern.test(newemail)) {
      formIsValid = false;
    }

    if (secondaryEmail == "") {
      document.querySelector("#secondEmail + .error-message").textContent =
        "Enter a valid secondary email";
      formIsValid = false;
    }

    // Phone number validation: Check if the phone number is filled and valid
    if (phone.trim() === "") {
      document.querySelector("#phoneNumber + .error-message").textContent =
        "Phone Number is required";
      formIsValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      document.querySelector("#phoneNumber + .error-message").textContent =
        "Enter a valid phone number";
      formIsValid = false;
    }

    if (!formIsValid) {
      event.preventDefault(); // Prevent form from submitting
      return; // Exit the function
    }

    const data = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      newemail: document.getElementById("newemail").value, // Adjusted as needed
      secondaryEmail: document.getElementById("secondaryEmail").value,
      phone: document.getElementById("phoneNumber").value,
    };

    try {
      const response = await fetch(form.action, {
        method: form.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Send data as JSON
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: result.message || "Account updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        })
        // .then(() => {
        //   window.location.reload(); // Reload the page after confirmation
        // });
        document.getElementById("userName").textContent=result.userData.name
        document.getElementById("userEmail").textContent=result.userData.email
        document.getElementById("secondEmail").textContent=result.userData.secondaryEmail
        document.getElementById("phoneNum").textContent=result.userData.phone

      } else {
        Swal.fire({
          title: "Error!",
          text:
            result.message || "An error occurred while updating the account.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  });
});

// change pass
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePassForm");

  form.addEventListener("submit", async (event) => {
    document
      .querySelectorAll(".error-msg")
      .forEach((msg) => (msg.textContent = ""));

    let formIsValid = true;
    const currentPassword = document
      .getElementById("current-password")
      .value.trim();
    const newPassword = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirm-password")
      .value.trim();

    if (currentPassword === "") {
      document.getElementById("error1").textContent =
        "Current password is required";
      formIsValid = false;
    }

    const alpha = /[a-zA-Z]/;
    const digit = /\d/;
    const error3 = document.getElementById("error2");
    const error4 = document.getElementById("error3");

    // New Password Validation
    if (newPassword.length < 8) {
      error3.style.display = "block";
      error3.innerHTML = "Should contain at least 8 characters";
    } else if (!alpha.test(newPassword) || !digit.test(newPassword)) {
      error3.style.display = "block";
      error3.innerHTML = "Should contain numbers and alphabets";
    } else {
      error3.style.display = "none";
      error3.innerHTML = "";
    }

    // Confirm Password Validation
    if (newPassword !== confirmPassword) {
      error4.style.display = "block";
      error4.innerHTML = "Passwords do not match";
    } else {
      error4.style.display = "none";
      error4.innerHTML = "";
    }

    // Prevent form submission if validation fails
    if (!formIsValid) {
      event.preventDefault();
      return;
    }

    // If form is valid, send the data via fetch
    event.preventDefault();

    const data = {
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
      email: document.getElementById("email").value,
    };

    try {
      const response = await fetch(form.action, {
        method: form.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: result.message || "Password updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        })
        event.target.reset()
      } else {
        Swal.fire({
          title: "Error!",
          text:
            result.message || "An error occurred while updating the password.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  });
});
