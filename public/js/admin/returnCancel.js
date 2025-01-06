async function getReturnCancel() {
    try {
      const response = await fetch("/admin/getReturnCancel");
      if (!response.ok) throw new Error("Failed to fetch return/cancel data");
  
      const result = await response.json();
      console.log(result.orders);
      
      renderReturnCancelTable(result.orders);
    } catch (error) {
      console.error("Error fetching return/cancel data:", error);
    }
  }
  
  function renderReturnCancelTable(orders) {
    const tableBody = document.querySelector("#returnCancelTable tbody");
    tableBody.innerHTML = "";
  
    if (!orders || orders.length === 0) {
      const row = `<tr><td colspan="9" class="text-center">No records found</td></tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
      return;
    }
  
    orders.forEach((order) => {
      order.orderedItem.forEach((product) => {
        const row = `
          <tr>
            <td class="text-center">
              <img src="${product.firstImage}" alt="${product.productName}" class="img-fluid" style="width: 30px; height: 30px;">
            </td>
            <td>${product.productName}</td>
            <td>${product.quantity}</td>
            <td>${product.productStorage}</td>
            <td>₹${product.total.toLocaleString()}</td>
            <td>
              <div class="form-select form-select-sm" aria-label="Status">${product.status}</div>
            </td>
            <td>${new Date(order.invoiceDate).toLocaleDateString()}</td>
            <td>${product.reason || "N/A"}</td>
            <td>
              <button class="btn btn-success p-1" onclick="submitAcceptForm('${order.orderId}', '${product.product}', '${product.quantity}', '${product._id}', '${product.status}', '${product.paymentMethod}')">Accept</button>
              <button class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#rejectModal${product._id}">
                Cancel
              </button>
  
              <div class="modal fade" id="rejectModal${product._id}" tabindex="-1" aria-labelledby="rejectModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="rejectModalLabel">Reject Cancel Request</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <form id="rejectForm${product._id}">
                        <div class="mb-3">
                          <label for="rejectReason${product._id}" class="form-label">Reason for Rejection:</label>
                          <textarea class="form-control" id="rejectReason${product._id}" name="rejectReason" rows="3" required></textarea>
                        </div>
                        <input type="hidden" name="productId" value="${product._id}">
                        <input type="hidden" name="orderId" value="${order._id}">
                        <button type="button" class="btn btn-danger" onclick="submitRejectForm('${product._id}')">Reject Request</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });
    });
  }
  
  getReturnCancel();
  


function submitRejectForm(productId) {
  const form = document.getElementById(`rejectForm${productId}`);
  const rejectReason = document.getElementById(
    `rejectReason${productId}`
  ).value;
  const orderId = form.querySelector('input[name="orderId"]').value;
  const productIdValue = form.querySelector('input[name="productId"]').value;

  const data = {
    rejectReason: rejectReason,
    orderId: orderId,
    productId: productIdValue,
  };

  fetch("/admin/rejectCancelRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "Cancel request rejected successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          getReturnCancel();
          // window.location.reload(); 
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Error rejecting cancel request: " + data.message,
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    })
    .catch((error) => {
      // Handle error
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while processing your request. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    });
}

function submitAcceptForm(
  orderId,
  productId,
  quantity,
  itemId,
  status,
  paymentMethod
) {
  console.log(orderId, productId, quantity, status);
  const data = {
    orderId: orderId,
    productId: productId,
    quantity,
    itemId,
    status,
    paymentMethod,
  };
  fetch("/admin/acceptRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "Accept request processed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        })
        getReturnCancel();
      } else {
        Swal.fire({
          title: "Error!",
          text: "Error processing accept request: " + data.message,
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    })
    .catch((error) => {
      // Handle error
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while processing your request. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    });
}
