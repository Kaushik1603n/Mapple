function updateCategoryStatus(categoryId, status) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to change the Category status?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/updateCategoryStatus/${categoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status === 'list' }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Category status updated successfully!',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });

                        const statusElement = document.querySelector(`#category-status-${categoryId}`);
                        if (statusElement) {
                            statusElement.textContent = status === 'blocked' ? 'Blocked' : 'Active';
                        }
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to update category status.',
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



function deleteCategory(categId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this Category? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/deleteCategory/${categId}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Category deleted successfully.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Reload the page after user confirms the success alert
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Failed to delete category.',
                            icon: 'error',
                            confirmButtonText: 'Try Again'
                        });
                        console.error("Failed to delete category");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'An error occurred while deleting the category.',
                        icon: 'error',
                        confirmButtonText: 'OK'
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
            alertMessage.innerText = ""
        }, 4000);
    }
};