
function updateProductStatus(prdId, status) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to change the Product status?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/updateProductStatus/${prdId}`, {
                method: 'PATCH', // PATCH is appropriate for partial updates
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status }), // Adjust based on your backend logic
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Product status updated successfully!',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to update Product status.',
                            icon: 'error',
                            confirmButtonText: 'Try Again'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'An error occurred. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}




function deleteProduct(prdId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this Product? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/deleteProduct/${prdId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: data.message || 'Product deleted successfully.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Reload the page after user confirms the success alert
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Failed to delete the product.',
                            icon: 'error',
                            confirmButtonText: 'Try Again'
                        });
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'An error occurred while deleting the Product. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}


function showAlert(message, type) {

    const alertBox = document.createElement('div');
    alertBox.id = 'alertBox';
    alertBox.className = `alert alert-${type} show`;
    alertBox.role = 'alert';
    alertBox.innerHTML = message;
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.classList.remove('show');
        alertBox.classList.add('hide');
        setTimeout(() => alertBox.remove(), 700);
    }, 3000);
}