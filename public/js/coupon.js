async function getAllCoupon() {
  try {
    const response = await fetch("/admin/getAllCoupon");
    if (!response.ok) throw new Error("Failed to fetch getAllCoupon data");

    const result = await response.json();

    renderCouponTable(result.coupons);
  } catch (error) {
    console.error("Error fetching getAllCoupon data:", error);
  }
}
getAllCoupon();

function renderCouponTable(coupons) {
  const tableBody = document.querySelector("#allCouponTable tbody");
  tableBody.innerHTML = "";

  if (!coupons || coupons.length === 0) {
    const row = `<tr><td colspan="8" class="text-center">No records found</td></tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
    return;
  }

  coupons.forEach((coupon) => {
    const row = `
        <tr>
          <td>${coupon.couponCode}</td>
          <td>${coupon.discount}%</td>
          <td>₹${coupon.maxDiscount}</td>
          <td>${coupon.mininumParchase}</td>
          <td>${new Date(coupon.startDate).toLocaleDateString()}</td>
          <td>${new Date(coupon.endDate).toLocaleDateString()}</td>
          <td>
            <select class="form-select form-select-sm" aria-label="Status" onchange="updateCouponStatus('${
              coupon._id
            }', this.value)">
              <option value="true" ${
                coupon.isList === true ? "selected" : ""
              }>Active</option>
              <option value="false" ${
                coupon.isList === false ? "selected" : ""
              }>Block</option>
            </select>
          </td>
          <td>
            <button onclick="window.location.href='/admin/updateCoupon/${
              coupon._id
            }'" class="btn btn-sm btn-outline-primary">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-coupon" data-id="${
              coupon._id
            }">Delete</button>
          </td>
        </tr>
      `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

function updateCouponStatus(couponId, status) {
  if (confirm("Are you sure you want to change the Coupon's status?")) {
    fetch(`/admin/update-Coupon-status/${couponId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status == "true" }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: "Success!",
            text: "Coupon status updated successfully!",
            icon: "success",
            confirmButtonText: "OK",
          });
          getAllCoupon();
        } else {
          Swal.fire({
            title: "Error!",
            text: "Failed to update Coupon status.",
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
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-coupon")) {
    const couponId = event.target.getAttribute("data-id");

    // Debugging
    console.log("Delete button clicked!");
    console.log("Coupon ID:", couponId);

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`/admin/deleteCoupon/${couponId}`, {
          method: "DELETE",
        })
          .then((response) => {
            console.log("Response:", response); // Debug
            if (response.ok) {
              Swal.fire("Deleted!", "Your coupon has been deleted.", "success");
              getAllCoupon();
            } else {
              Swal.fire("Error", "Failed to delete coupon.", "error");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            Swal.fire("Error", "An error occurred.", "error");
          });
      }
    });
  }
});
