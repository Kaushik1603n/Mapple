function payAgain(orderId) {
    // alert(` ${orderId}`);

    fetch('/user/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }), // Send the existing orderId to the backend
    })
        .then(response => response.json())
        .then(data => {
            const options = {
                key: 'rzp_test_teltatkxHwElFD', // Razorpay test key
                amount: data.amount, // Amount in paise
                currency: 'INR',
                name: 'Your Company Name',
                description: 'Re-Payment for Order',
                order_id: data.orderId, // Use the returned orderId
                handler: function (response) {
                    console.log('Re-payment successful!', response);
                    // Call a function to update the order status
                    updateOrderStatus(data.orderId, response);
                },
                prefill: {
                    name: 'John Doe', // Pre-fill customer details
                    email: 'john.doe@example.com',
                    contact: '9037608236',
                },
                theme: {
                    color: '#3399cc',
                },
            };

            const rzp1 = new Razorpay(options);
            rzp1.open();
        })
        .catch(error => console.error('Error:', error));
}

function updateOrderStatus(orderId, response) {
    // alert(orderId)
    // Optional: Send the payment response to the server to update the order status
    fetch('/user/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentResponse: response }),
    }).then(res => res.json())
        .then(data => {
            console.log('Order status updated:', data);

            window.location.href = '/user/orders';  // Replace with your desired URL
        })
        .catch(error => {
            console.error('Error updating order status:', error);
        });
}