function handleAddMoney() {
    const amount = document.getElementById("amount").value;
  
    if (!amount) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill in all fields before proceeding!",
      });
      return;
    }
  
    Swal.fire({
      icon: "success",
      title: "Success",
      text: `₹${amount} has been added `,
    });
  
    // Close the modal after a delay
    // setTimeout(() => {
    //     const modal = document.getElementById("addMoneyModal");
    //     const modalInstance = bootstrap.Modal.getInstance(modal);
    //     modalInstance.hide();
    // }, 2000);
  
    if (amount) {
      fetch("/user/addmoney", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((result) => {
          if (result.updatedWallet && result.updatedWallet.balance) {
            Swal.fire({
              title: "Success!",
              text: "Money added successfully!",
              icon: "success",
              confirmButtonText: "OK",
            }).then(() => {
              const modal = document.getElementById("addMoneyModal");
              if (modal) {
                const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
                if (modalInstance) modalInstance.hide();
              }
              document.getElementById("walletAmount").textContent =
                result.updatedWallet.balance.toLocaleString();
              allTransactionDetails();
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: "Failed to add money.",
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
  
  async function allTransactionDetails() {
    try {
      const response = await fetch("/user/transaction");
      if (!response.ok) throw new Error("Failed to fetch transaction data");
  
      const result = await response.json();
  
      // Process and display data
      console.log(result.transaction);
      renderTransactionTable(result.transaction.transactions);
    } catch (error) {
      console.error("Error fetching ledger data:", error);
    }
  }
  
  allTransactionDetails();
  
  function renderTransactionTable(transactions) {
    const tableBody = document.querySelector("#walletTransactionTable tbody");
    tableBody.innerHTML = "";
  
    // Display a message if there are no transactions
    if (transactions.length === 0) {
      const row = `<tr><td colspan="4" class="text-center">No records found</td></tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
      return;
    }
  
    // Iterate through each transaction and generate table rows
    transactions.forEach((transaction) => {
      const row = `
          <tr>
            <td>${transaction._id || "N/A"}</td>
            <td >${
              transaction.date
                ? new Date(transaction.date).toLocaleString()
                : "N/A"
            }</td>
            <td class="text-danger">${
              transaction.transactionType === "withdrawal"
                ? transaction.amount || "N/A"
                : "-"
            }</td>
            <td class="text-success">${
              transaction.transactionType === "deposit"
                ? transaction.amount || "N/A"
                : "-"
            }</td>
          </tr>
        `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }
  