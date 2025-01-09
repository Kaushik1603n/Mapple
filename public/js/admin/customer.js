function updateUserStatus(userId, status) {
  Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to change the user's status?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
  }).then((result) => {
      if (result.isConfirmed) {
          fetch(`/admin/update-customer-status/${userId}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ isBlock: status === "blocked" }),
          })
              .then((response) => response.json())
              .then((data) => {
                  if (data.success) {
                      Swal.fire({
                          title: "Success!",
                          text: "User status updated successfully!",
                          icon: "success",
                          confirmButtonText: "OK",
                      }).then(() => {
                          location.reload(); // Reload the page after success
                      });
                  } else {
                      Swal.fire({
                          title: "Error!",
                          text: "Failed to update user status.",
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

// Function to delete a user
function deleteUser(userId) {
  Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this user? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
  }).then((result) => {
      if (result.isConfirmed) {
          fetch(`/admin/deleteCustomer/${userId}`, {
              method: "DELETE",
          })
              .then((response) => response.json())
              .then((data) => {
                  if (data.success) {
                      Swal.fire({
                          title: "Success!",
                          text: "User deleted successfully.",
                          icon: "success",
                          confirmButtonText: "OK",
                      }).then(() => {
                          location.reload(); // Reload the page after success
                      });
                  } else {
                      Swal.fire({
                          title: "Error!",
                          text: "Failed to delete user.",
                          icon: "error",
                          confirmButtonText: "Try Again",
                      });
                  }
              })
              .catch((error) => {
                  console.error("Error:", error);
                  Swal.fire({
                      title: "Error!",
                      text: "An error occurred while deleting the user.",
                      icon: "error",
                      confirmButtonText: "OK",
                  });
              });
      }
  });
}

window.onload = function () {
  const alertMessage = document.getElementById("alertMessage");
  if (alertMessage) {
    setTimeout(() => {
      alertMessage.classList.remove("show");
      alertMessage.classList.add("d-none");
      alertMessage.innerText = "";
    }, 4000);
  }
};
