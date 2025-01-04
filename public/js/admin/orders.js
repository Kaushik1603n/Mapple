let currentPage =  new URLSearchParams(window.location.search).get("page") || 1;
const limit = 6;

async function getOffers(page = currentPage) {
  try {
    const response = await fetch(`/admin/getOrders?page=${page}&limit=6`);
    if (!response.ok) throw new Error("Failed to fetch orders data");

    const result = await response.json();
    renderOfferTable(result.orders);
    renderPagination(result.totalPages, result.currentPage, result.totalOrders);
    currentPage = page;
    window.history.pushState({}, "", `?page=${page}`);
  } catch (error) {
    console.error("Error fetching orders data:", error);
  }
}

function renderOfferTable(orders) {
  const tableBody = document.querySelector("#orderTable tbody");
  tableBody.innerHTML = "";

  if (!orders || orders.length === 0) {
    const row = `<tr><td colspan="9" class="text-center">No records found</td></tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
    return;
  }

  orders.forEach((order) => {
    const row = `
      <tr>
        <td class="text-center">
          <img src="${order.orderedItem.firstImage || "default-image.jpg"}" 
               alt="${order.orderedItem.productName}" 
               class="img-fluid" style="width: 30px; height: 30px;">
        </td>
        <td>${order.orderedItem.productName}</td>
        <td>${order.orderedItem.quantity}</td>
        <td>${order.orderedItem.productColor}</td>
        <td>${order.orderedItem.productStorage}</td>
        <td>₹${order.orderedItem.total.toLocaleString()}</td>
        <td>
          <select class="form-select form-select-sm" aria-label="Status"
                  onchange="updateOrderStatus('${
                    order.orderedItem._id
                  }', this.value)"
                  ${
                    ["Delivered", "Canceled", "Returned"].includes(
                      order.orderedItem.status
                    )
                      ? "disabled"
                      : ""
                  }>
            <option value="pending" ${
              order.orderedItem.status === "pending" ? "selected" : ""
            }>Pending</option>
            <option value="processing" ${
              order.orderedItem.status === "processing" ? "selected" : ""
            }>Processing</option>
            <option value="shipped" ${
              order.orderedItem.status === "shipped" ? "selected" : ""
            }>Shipped</option>
            <option value="Delivered" ${
              order.orderedItem.status === "Delivered" ? "selected" : ""
            }>Delivered</option>
            <option value="Canceled" ${
              order.orderedItem.status === "Canceled" ? "selected" : ""
            }>Canceled</option>
            <option value="Cancel Request" ${
              order.orderedItem.status === "Cancel Request" ? "selected" : ""
            }>Cancel Request</option>
            <option value="Return Request" ${
              order.orderedItem.status === "Return Request" ? "selected" : ""
            }>Return Request</option>
            <option value="Returned" ${
              order.orderedItem.status === "Returned" ? "selected" : ""
            }>Returned</option>
          </select>
        </td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>
          <button onclick="window.location.href='/admin/viewOrder/${
            order.orderedItem._id
          }'" 
                  class="btn btn-sm btn-outline-primary">View</button>
        </td>
      </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

function renderPagination(totalPages, currentPage, totalOrders) {
  const paginationContainer = document.querySelector(".pagination");
  paginationContainer.innerHTML = ""; // Clear existing pagination

  // Previous Button
  const prevClass = currentPage === 1 ? "disabled" : "";
  paginationContainer.insertAdjacentHTML(
    "beforeend",
    `<li class="page-item ${prevClass}">
      <a class="page-link" href="#" onclick="getOffers(${
        currentPage - 1
      })">←</a>
    </li>`
  );

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const activeClass = currentPage === i ? "active" : "";
    paginationContainer.insertAdjacentHTML(
      "beforeend",
      `<li class="page-item ${activeClass}">
        <a class="page-link" href="#" onclick="getOffers(${i})">${i}</a>
      </li>`
    );
  }

  // Next Button
  const nextClass = currentPage === totalPages ? "disabled" : "";
  paginationContainer.insertAdjacentHTML(
    "beforeend",
    `<li class="page-item ${nextClass}">
      <a class="page-link" href="#" onclick="getOffers(${
        currentPage + 1
      })">→</a>
    </li>`
  );

  // Showing details
  const showingDetails = document.querySelector(".d-flex p");
  showingDetails.textContent = `Showing ${
    (currentPage - 1) * limit + 1
  } to ${Math.min(
    currentPage * limit,
    totalOrders
  )} of ${totalOrders} products`;
}

getOffers(currentPage);

function updateOrderStatus(itemId, status) {
  if (confirm("Are you sure you want to change the Order status?")) {
    console.log(itemId, status);

    fetch(`/admin/updateOrderStatus/${itemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status }), // Adjust based on your backend logic
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: "Success!",
            text: "Order status updated successfully!",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => {
            getOffers(currentPage);
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: "Failed to update Order status.",
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
