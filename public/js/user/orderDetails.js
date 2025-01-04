async function getInvoice(orderId) {
  try {
      const response = await fetch(`/user/downloadInvoice/${orderId}`, {
          method: 'GET',
      });

      if (response.ok) {
          const blob = await response.blob();

          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;

          a.download = `invoice - ${orderId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } else {
          console.error('Failed to fetch invoice:', await response.text());
          alert('Failed to download the invoice. Please try again later.');
      }
  } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('An error occurred while downloading the invoice.');
  }
}

function processReturn(itemId) {
  const reason = document.getElementById(`returnReason${itemId}`).value;
  if (!reason) {
      Swal.fire({
          title: 'Input Required!',
          text: 'Please provide a reason for the return.',
          icon: 'warning',
          confirmButtonText: 'OK'
      });

      return;
  }

  // Make a POST request or handle the return logic here
  fetch('/user/returnProduct', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, reason }),
  })
      .then(response => response.json())
      .then(data => {
          Swal.fire({
              title: 'Success!',
              text: data.message || "Product return processed successfully.",
              icon: 'success',
              confirmButtonText: 'OK'
          }).then(() => {
              location.reload(); // Reload the page after the user clicks "OK"
          });

      })
      .catch(error => {
          console.error('Error:', error);
          Swal.fire({
              title: 'Error!',
              text: 'An error occurred while processing the return.',
              icon: 'error',
              confirmButtonText: 'OK'
          });

      });
}
function cancelProducts(itemId) {
  // Select the unique textarea for the specific item
  const reasonInput = document.getElementById(`cancelAllReason${itemId}`);
  const reason = reasonInput ? reasonInput.value.trim() : '';

  if (!reason) {
      Swal.fire({
          title: 'Input Required!',
          text: 'Please provide a reason for the cancellation.',
          icon: 'warning',
          confirmButtonText: 'OK'
      });

      return;
  }

  // Log the input values for debugging
  console.log("Item ID:", itemId, "Reason:", reason);

  // Make the POST request
  fetch('/user/cancelProduct', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, reason }),
  })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              Swal.fire({
                  title: 'Success!',
                  text: data.success || "Products cancelled successfully.",
                  icon: 'success',
                  confirmButtonText: 'OK'
              }).then(() => {
                  location.reload(); // Reload the page after the user clicks "OK"
              });
          } else {
              Swal.fire({
                  title: 'Error!',
                  text: data.message || "Failed to cancel the products.",
                  icon: 'error',
                  confirmButtonText: 'Try Again'
              });
          }

      })
      .catch(error => {
          console.error('Error:', error);
          Swal.fire({
              title: 'Error!',
              text: 'An error occurred while cancelling  products.',
              icon: 'error',
              confirmButtonText: 'OK'
          });

      });
}
// Listen for the modal to be shown and set the productId
document.getElementById('reviewModal').addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const productId = button.getAttribute('data-product-id');
  document.getElementById('productId').value = productId;
  console.log('Product ID set to:', productId); // Debugging
});

// Handle form submission
document.getElementById('reviewForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const title = document.getElementById('reviewTitle').value;
  const rating = document.getElementById('reviewRating').value;
  const comments = document.getElementById('reviewComments').value;
  const productId = document.getElementById('productId').value;

  const reviewData = { productId, title, rating, comments };

  try {
      const response = await fetch('/user/productReview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
      });

      if (response.ok) {
          const data = await response.json();
          Swal.fire({
              title: 'Success!',
              text: data.message || 'Review submitted successfully!',
              icon: 'success',
              confirmButtonText: 'OK'
          });
          document.getElementById('reviewForm').reset();
          bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
      } else {
          const error = await response.json();
          Swal.fire({
              title: 'Error!',
              text: `Error: ${error.message}`,
              icon: 'error',
              confirmButtonText: 'Try Again'
          });
      }
  } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
          title: 'Error!',
          text: 'An unexpected error occurred.',
          icon: 'error',
          confirmButtonText: 'OK'
      });
  }
});

