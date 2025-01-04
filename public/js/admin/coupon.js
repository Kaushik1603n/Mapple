let currentPage = 1;
const limit = 5; // Set the limit (number of offers per page)
async function getOffers(page = 1) {
    try {
      const response = await fetch(`/admin/getOffers?page=${page}&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch offers data");
  
      const result = await response.json();
      console.log(result.allOffers);
  
      renderOfferTable(result.allOffers);
      renderPagination(result.totalPages, result.currentPage, result.totalOffers);
    } catch (error) {
      console.error("Error fetching offers data:", error);
    }
  }
  
  function renderOfferTable(offers) {
    const tableBody = document.querySelector("#offerTable tbody");
    tableBody.innerHTML = ""; // Clear existing rows
  
    if (!offers || offers.length === 0) {
      const row = `<tr><td colspan="8" class="text-center">No records found</td></tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
      return;
    }
  
    // Loop through the offers and render each row
    offers.forEach((offer) => {
      const row = `
        <tr>
          <td>${offer.offerType}</td>
          <td>${offer.productCategory}</td>
          <td>${offer.title}</td>
          <td>${offer.offer}</td>
          <td>${new Date(offer.startDate).toLocaleDateString()}</td>
          <td>${new Date(offer.endDate).toLocaleDateString()}</td>
          <td>
            <select class="form-select form-select-sm" aria-label="Status" onchange="updateOfferStatus('${offer._id}', this.value)">
              <option value="Active" ${offer.status === "Active" ? "selected" : ""}>Active</option>
              <option value="Inactive" ${offer.status === "Inactive" ? "selected" : ""}>Inactive</option>
            </select>
          </td>
          <td>
            <button onclick="window.location.href='/admin/updateOffer/${offer._id}'" class="btn btn-sm btn-outline-primary">Edit</button>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }
  
  function renderPagination(totalPages, currentPage, totalOffers) {
    const paginationContainer = document.querySelector("#pagination-controls");
    paginationContainer.innerHTML = ""; // Clear any existing pagination controls
  
    if (totalPages <= 1) return; // No pagination if there's only one page
  
    const startCount = (currentPage - 1) * 5 + 1;
    const endCount = Math.min(currentPage * 5, totalOffers);
  
    // Update the showing count
    document.getElementById("start-count").textContent = startCount;
    document.getElementById("end-count").textContent = endCount;
    document.getElementById("total-count").textContent = totalOffers;
  
    // Previous Button
    const prevPage = currentPage > 1 ? currentPage - 1 : 1;
    const prevButton = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="javascript:void(0);" onclick="getOffers(${prevPage})">←</a>
      </li>
    `;
    
    // Next Button
    const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;
    const nextButton = `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="javascript:void(0);" onclick="getOffers(${nextPage})">→</a>
      </li>
    `;
  
    paginationContainer.insertAdjacentHTML("beforeend", prevButton);
  
    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageItem = `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <a class="page-link" href="javascript:void(0);" onclick="getOffers(${i})">${i}</a>
        </li>
      `;
      paginationContainer.insertAdjacentHTML("beforeend", pageItem);
    }
  
    paginationContainer.insertAdjacentHTML("beforeend", nextButton);
  }
  
getOffers(currentPage);


function updateOfferStatus(offerId, status) {
  if (confirm("Are you sure you want to change the Offer's status?")) {
    fetch(`/admin/update-Offer-status/${offerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: "Success!",
            text: "Offer status updated successfully!",
            icon: "success",
            confirmButtonText: "OK",
          })
          getOffers(); 
        } else {
          Swal.fire({
            title: "Error!",
            text: "Failed to update Offer status.",
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
