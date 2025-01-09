// alert("shb")

const updateCartTotals = (updatedCart) => {
    document.getElementById('subtotal').textContent = updatedCart.totalAmount.toFixed(2);
    document.getElementById('discount').textContent = (updatedCart.totalDiscountAmount || 0).toFixed(2);
    document.getElementById('total').textContent = (updatedCart.totalActualAmount || 0).toFixed(2);
};
document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', async function () {
        const itemId = this.getAttribute('data-item-id');

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/user/cart/remove/${itemId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const updatedCart = await response.json();
                        this.closest('tr').remove(); 
                        console.log(updatedCart);                                
                        updateCartTotals(updatedCart); 
                        Swal.fire('Deleted!', 'Your item has been removed.', 'success');
                    } else {
                        Swal.fire('Error!', 'Failed to remove the item.', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire('Error!', 'An error occurred while deleting the item.', 'error');
                }
            }
        });
    });
});

document.querySelectorAll('.increment, .decrement').forEach(button => {
    button.addEventListener('click', async function () {
        const itemId = this.getAttribute('data-item-id');
        const action = this.classList.contains('increment') ? 'increment' : 'decrement';

        try {
            const response = await fetch('/user/cart/update-quantity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId, action }),
            });

            if (response.ok) {
                const updatedCart = await response.json();
                // console.log(updatedCart);
                
                const quantityDisplay = this.parentElement.querySelector('.quantity-display');
                const totalDisplay = this.closest('tr').querySelector('.total');
                const updatedItem = updatedCart.items.find(item => item._id === itemId);

                if (updatedItem) {
                    quantityDisplay.textContent = updatedItem.quantity;
                    totalDisplay.textContent = updatedItem.totalprice.toFixed(2);
                }

                updateCartTotals(updatedCart); // Update totals dynamically
            } else {
                const error = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: error.message,
                });
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while updating the quantity.',
            });
        }
    });
});
