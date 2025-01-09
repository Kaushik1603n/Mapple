document
  .querySelector('[data-bs-toggle="collapse"]')
  .addEventListener("click", function () {
    const icon = this.querySelector("i");
    if (icon.classList.contains("fa-angle-down")) {
      icon.classList.remove("fa-angle-down");
      icon.classList.add("fa-angle-up");
    } else {
      icon.classList.remove("fa-angle-up");
      icon.classList.add("fa-angle-down");
    }
  });

document
  .getElementById("addressForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Retrieve form values
    const homeAddress = document.getElementById("houseAddress").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const name = document.getElementById("name").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const zipCode = document.getElementById("zipCode").value.trim();
    const country = document.getElementById("country").value.trim();

    // Error elements
    const errors = {
      houseAddressError: document.getElementById("houseAddressError"),
      landmarkError: document.getElementById("landmarkError"),
      nameError: document.getElementById("nameError"),
      phoneNumberError: document.getElementById("phoneNumberError"),
      cityError: document.getElementById("cityError"),
      stateError: document.getElementById("stateError"),
      zipCodeError: document.getElementById("zipCodeError"),
      countryError: document.getElementById("countryError"),
    };

    // Clear previous errors
    for (const key in errors) {
      errors[key].textContent = "";
    }

    // Validation
    let isValid = true;

    if (!homeAddress) {
      errors.houseAddressError.textContent = "House address is required.";
      isValid = false;
    }
    if (!landmark) {
      errors.landmarkError.textContent = "Landmark is required.";
      isValid = false;
    }
    if (!name) {
      errors.nameError.textContent = "Name is required.";
      isValid = false;
    }
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      errors.phoneNumberError.textContent =
        "Enter a valid 10-digit phone number.";
      isValid = false;
    }
    if (!city) {
      errors.cityError.textContent = "City is required.";
      isValid = false;
    }
    if (!state) {
      errors.stateError.textContent = "State is required.";
      isValid = false;
    }
    if (!zipCode || !/^\d{6}$/.test(zipCode)) {
      errors.zipCodeError.textContent = "Enter a valid 6-digit zip code.";
      isValid = false;
    }
    if (!country) {
      errors.countryError.textContent = "Country is required.";
      isValid = false;
    }

    // Stop if any validation fails
    if (!isValid) return;

    // Prepare data for sending
    const formData = {
      homeAddress,
      landmark,
      name,
      phoneNumber,
      city,
      state,
      zipCode,
      country,
    };

    try {
      // Send data to the server
      const response = await fetch("/user/addAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Address updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        getAddress()
        event.target.reset()

      } else {
        Swal.fire({
          title: "Error!",
          text: `Error: ${result.message || "Failed to update address."}`,
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating the address.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  });

  function deleteAddress(addressId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this address? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/user/address/delete/${addressId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => {
                    if (response.ok) {
                        Swal.fire({
                            title: "Success!",
                            text: "Address deleted successfully!",
                            icon: "success",
                            confirmButtonText: "OK",
                        }).then(() => {
                            getAddress(); // Refresh the address list
                        });
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: "Failed to delete address.",
                            icon: "error",
                            confirmButtonText: "Try Again",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: "Error!",
                        text: "An error occurred. Please try again.",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                });
        }
    });
}


function editAddress(addressData) {
  console.log(addressData);
  const address = addressData;
  if (address) {
    document.getElementById("editAddressId").value = address._id;
    document.getElementById("editHomeAddress").value = address.homeAddress;
    document.getElementById("editLandmark").value = address.landmark;
    document.getElementById("editName").value = address.name;
    document.getElementById("editPhoneNumber").value = address.phoneNumber;
    document.getElementById("editCountry").value = address.country;
    document.getElementById("editCity").value = address.city;
    document.getElementById("editState").value = address.state;
    document.getElementById("editZipCode").value = address.zipCode;

    // Show the modal
    const editModal = new bootstrap.Modal(
      document.getElementById("editAddressModal")
    );
    editModal.show();
  } else {
    Swal.fire({
      title: "Not Found!",
      text: "Address not found!",
      icon: "warning",
      confirmButtonText: "OK",
    });
  }
}

function saveAddress(event) {
  event.preventDefault();

  const addressId = document.getElementById("editAddressId").value;
  const updatedData = {
    homeAddress: document.getElementById("editHomeAddress").value,
    landmark: document.getElementById("editLandmark").value,
    name: document.getElementById("editName").value,
    phoneNumber: document.getElementById("editPhoneNumber").value,
    country: document.getElementById("editCountry").value,
    city: document.getElementById("editCity").value,
    state: document.getElementById("editState").value,
    zipCode: document.getElementById("editZipCode").value,
  };

  fetch(`/user/address/edit/${addressId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  })
    .then((response) => {
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Address updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          const modalElement = document.getElementById("editAddressModal"); 
          const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
          bootstrapModal.hide();
          getAddress();
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Failed to update address.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    });
}

async function getAddress() {
  try {
    const response = await fetch("/user/userAddress");
    if (!response.ok) throw new Error("Failed to fetch userAddress data");

    const result = await response.json();

    console.log(result.userAddress);
    renderUserAddress(result.userAddress);
  } catch (error) {
    console.error("Error fetching userAddress data:", error);
  }
}

function renderUserAddress(userAddress) {
  const container = document.getElementById("addressDetails");

  // Clear existing content
  container.innerHTML = "";

  if (userAddress && userAddress.length > 0) {
    userAddress.forEach((addr, index) => {
      const addressHTML = `
          <div class="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
            <div>
              <h6>Address ${index + 1}</h6>
              <div><span>House Address :</span> <span><b>${
                addr.homeAddress
              }</b></span></div>
              <div><span>Landmark :</span> <span><b>${
                addr.landmark
              }</b></span></div>
              <div><span>Name :</span> <span><b>${addr.name}</b></span></div>
              <div><span>Phone Number :</span> <span><b>${
                addr.phoneNumber
              }</b></span></div>
              <div><span>Country :</span> <span><b>${
                addr.country
              }</b></span></div>
              <div><span>City :</span> <span><b>${addr.city}</b></span></div>
              <div><span>State :</span> <span><b>${addr.state}</b></span></div>
              <div><span>Zip Code :</span> <span><b>${
                addr.zipCode
              }</b></span></div>
            </div>
            <!-- Action Buttons -->
            <div>
              <!-- Edit Button -->
              <button class="btn btn-warning btn-sm me-2" onclick='editAddress(${JSON.stringify(
                addr
              )})'>
                <i class="fa-solid fa-pen"></i> Edit
              </button>
              <!-- Delete Button -->
              <button class="btn btn-danger btn-sm" onclick="deleteAddress('${
                addr._id
              }')">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `;

      container.insertAdjacentHTML("beforeend", addressHTML);
    });
  } else {
    container.innerHTML = "<p>No address available.</p>";
  }
}

document.addEventListener("DOMContentLoaded", getAddress);
