document.getElementById("product-form").addEventListener("submit", function (e) {
    let isValid = true;

    // Clear previous error messages
    document.querySelectorAll(".error-text").forEach((element) => {
        element.innerText = "";
    });

    // Get form fields
    const offers = document.getElementById("offers").value;
    const productCategory = document.getElementById("product-category").value;
    const title = document.getElementById("quantity").value.trim();
    const description = document.getElementById("discription").value.trim();
    const offer = document.getElementById("offer").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const status = document.getElementById("status").value;
    const prdcatid = document.getElementById("product-category-Id").value;
   
    // Validate each field and display error near it
    if (!offers) {
        isValid = false;
        document.getElementById("offers-error").innerText = "Please select an offer type.";
    }

    if (!productCategory) {
        isValid = false;
        document.getElementById("product-category-error").innerText = "Please select a Product or Category Name.";
    }

    if (!title) {
        isValid = false;
        document.getElementById("title-error").innerText = "Title is required.";
    }

    if (!description) {
        isValid = false;
        document.getElementById("description-error").innerText = "Description is required.";
    }

    if (!offer || isNaN(offer) || offer <= 0 || offer > 100) {
        isValid = false;
        document.getElementById("offer-error").innerText = "Offer % must be a valid number between 1 and 100.";
    }

    if (!startDate) {
        isValid = false;
        document.getElementById("startDate-error").innerText = "Start Date is required.";
    }

    if (!endDate) {
        isValid = false;
        document.getElementById("endDate-error").innerText = "End Date is required.";
    } else if (new Date(startDate) > new Date(endDate)) {
        isValid = false;
        document.getElementById("endDate-error").innerText = "End Date must be after Start Date.";
    }

    // Prevent submission if form is invalid
    if (!isValid) {
        e.preventDefault();
        return;
    }
   

    // Create form data object
    const formData = {
        prdcatid,
        offers,
        productCategory,
        title,
        description,
        offer: parseFloat(offer),
        startDate,
        endDate,
        status,
    };
    // console.log(formData);
    

    // Prevent form's default submission
    e.preventDefault();

    // Submit the data using fetch
    fetch(`/admin/updateOffer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Offer added successfully.",
                    confirmButtonText: "OK",
                }).then(() => {
                    window.location.reload(); // Corrected reload
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Failed!",
                    text: data.message || "Could not add the Offer. Please try again.",
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
            console.error(err);
        });
});
