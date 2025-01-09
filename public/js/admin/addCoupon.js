document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("couponForm");

    form.addEventListener("submit", function (event) {
        // Prevent form submission for validation
        let isValid = true;

        // Validate Name
        const couponName = document.getElementById("couponName");
        if (couponName.value.trim() === "") {
            setError(couponName, "Name is required.");
            isValid = false;
        } else {
            clearError(couponName);
        }

        // Validate Coupon Code
        const couponCode = document.getElementById("couponCode");
        if (couponCode.value.trim() === "") {
            setError(couponCode, "Coupon code is required.");
            isValid = false;
        } else {
            clearError(couponCode);
        }

        // Validate Description
        const description = document.getElementById("description");
        if (description.value.trim() === "") {
            setError(description, "Description is required.");
            isValid = false;
        } else {
            clearError(description);
        }

        // Validate Discount
        const discount = document.getElementById("discount");
        if (discount.value === "" || discount.value < 1 || discount.value > 100) {
            setError(discount, "Enter a discount percentage between 1 and 100.");
            isValid = false;
        } else {
            clearError(discount);
        }

        // Validate State
        // const state = document.getElementById("state");
        // if (state.value.trim() === "") {
        //     setError(state, "State is required.");
        //     isValid = false;
        // } else {
        //     clearError(state);
        // }

        // Validate Max Value
        const max = document.getElementById("max");
        if (max.value === "" || max.value <= 0) {
            setError(max, "Maximum discount must be greater than 0.");
            isValid = false;
        } else {
            clearError(max);
        }

        // Validate Min Value
        const min = document.getElementById("min");
        if (min.value === "" || min.value <= 0) {
            setError(min, "Min parchase must be greater than 0.");
            isValid = false;
        } else {
            clearError(min);
        }

        // Validate Start Date
        const startDate = document.getElementById("startDate");
        if (startDate.value === "") {
            setError(startDate, "Start date is required.");
            isValid = false;
        } else {
            clearError(startDate);
        }

        // Validate End Date
        const endDate = document.getElementById("endDate");
        if (endDate.value === "") {
            setError(endDate, "End date is required.");
            isValid = false;
        } else if (new Date(endDate.value) < new Date(startDate.value)) {
            setError(endDate, "End date must be after the Start date.");
            isValid = false;
        } else if (new Date(endDate.value) <= new Date()) {
            setError(endDate, 'End date must be greater than today.');
            isValid = false;
        } else {
            clearError(endDate);
        }

        // Prevent form submission if any field is invalid
        if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
        }
        const data = {
            couponName: document.getElementById("couponName").value.trim(),
            couponCode: document.getElementById("couponCode").value.trim(),
            description: document.getElementById("description").value.trim(),
            discount: document.getElementById("discount").value.trim(),
            status: true,
            maxDiscount: document.getElementById("max").value.trim(),
            minParchase: document.getElementById("min").value.trim(),
            startDate: document.getElementById("startDate").value,
            endDate: document.getElementById("endDate").value,
        }
        console.log(data);
        event.preventDefault(); // Prevent the form from reloading the page

        if (isValid) {
            fetch("/admin/addcoupon", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then((response) => response.json()) // Parse the response as JSON
                .then((data) => {
                    if (data.success) { // Check for the 'success' property in the parsed data
                        Swal.fire({
                            icon: "success",
                            title: "Success!",
                            text: "Coupon added successfully.",
                            confirmButtonText: "OK",
                        }).then(()=>{
                            window.location.reload
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Failed!",
                            text: data.message || "Could not add the coupon. Please try again.",
                            confirmButtonText: "OK",
                        });
                    }
                })
                .catch((err) => {
                    Swal.fire({
                        icon: "error",
                        title: "Server Error!",
                        text: "An error occurred while connecting to the server.",
                        confirmButtonText: "OK",
                    });
                    console.log(err);
                });
        }


        // Add Bootstrap validation class
        // form.classList.add("was-validated");
    });

    // Function to set error messages
    function setError(element, message) {
        const parent = element.parentElement;
        parent.classList.add("was-validated");
        const feedback = parent.querySelector(".invalid-feedback");
        if (!feedback) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "invalid-feedback";
            errorDiv.textContent = message;
            parent.appendChild(errorDiv);
        } else {
            feedback.textContent = message;
        }
        element.classList.add("is-invalid");
        element.classList.remove("is-valid");
    }

    // Function to clear error messages
    function clearError(element) {
        const parent = element.parentElement;
        const feedback = parent.querySelector(".invalid-feedback");
        if (feedback) {
            feedback.remove();
        }
        element.classList.remove("is-invalid");
        element.classList.add("is-valid");
    }
});
