const alertBox = document.getElementById('alertBox');
const couponPanel = document.getElementById('couponPanel');
alertBox.addEventListener('click', () => {
    if (couponPanel.style.right === '0px') {
        couponPanel.style.right = '-300px';
    } else {
        couponPanel.style.right = '0px';
    }
});

async function getCoupon() {

    try {
        const response = await fetch('/user/getCoupon', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const coupon = await response.json();
        displayCoupon(coupon.data);
    } catch (error) {
        console.error('Error fetching coupon:', error);
    }
}
getCoupon();

function displayCoupon(coupons) {
    const couponList = document.querySelector('#couponPanel ul');

    couponList.innerHTML = ''; // Clear any existing coupons

    coupons.forEach(coupon => {
        const li = document.createElement('li'); // Create a new list item for each coupon

        li.innerHTML = `
    <span class="coupon-title">${coupon.couponCode} - </span><span class="text-success">${coupon.discount}% off</span>
    <p class="small text-muted mb-1">Max Discount: ${coupon.maxDiscount}</p>
    <p class="small text-muted mb-1">Min Purchase: ${coupon.mininumParchase}</p>
    <p class="small text-muted">Valid until: ${new Date(coupon.endDate).toLocaleDateString()}</p>
    <button class="btn btn-sm btn-outline-dark copy-btn" data-coupon-code="${coupon.couponCode}">Copy Code</button>
`;

        couponList.appendChild(li);

        const copyBtn = li.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            const couponCode = copyBtn.getAttribute('data-coupon-code');

            navigator.clipboard.writeText(couponCode)
                .then(() => {
                    console.log('Coupon code copied to clipboard!');
                })
                .catch((error) => {
                    console.error('Error copying text: ', error);
                });
        });
    });
}



document.getElementById("applyCouponBtn").addEventListener("click", () => {
    const couponCode = document.getElementById("couponCode").value;
    const totalAmount = parseFloat(document.getElementById("totalAmount").textContent.replace(/[^\d.-]/g, ""));

    fetch("/user/applyCoupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, totalAmount }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // alert("success", data.finalAmount)
                document.getElementById("couponMessage").textContent = data.message;
                document.getElementById("discountAmount").textContent = `₹${data.discount.toFixed(0)}`;
                document.getElementById("totalAmount").textContent = `₹${data.finalAmount.toFixed(0)}`;
                document.getElementById("removeCouponBtn").style.display = "block"
                document.getElementById("applyCouponBtn").style.display = "none"
                document.getElementById("couponMessageFalse").textContent = null

            } else {
                // alert("faild")
                document.getElementById("couponMessage").textContent = null;
                document.getElementById("couponMessageFalse").textContent = data.message;
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server issue");
        });

});

function remove_coupon() {
    const couponCode = document.getElementById("couponCode").value;
    const totalAmount = parseFloat(document.getElementById("totalActualAmount").textContent.replace(/[^\d.-]/g, ""));

    fetch("/user/removeCoupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, totalAmount }),
    }).then((response) => response.json())
        .then((data) => {
            if (data.success) {
                document.getElementById("removeCouponBtn").style.display = "none"
                document.getElementById("applyCouponBtn").style.display = "block"
                document.getElementById("couponMessage").textContent = data.message;
                document.getElementById("discountAmount").textContent = `-`;
                document.getElementById("totalAmount").textContent = `₹${data.totalAmount.toFixed(0)}`;
                document.getElementById("couponCode").value = null;
                document.getElementById("couponMessageFalse").textContent = null

            } else {
                // alert("faild")
                document.getElementById("couponMessage").textContent = null;
                document.getElementById("couponMessageFalse").textContent = data.message;
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server issue");
        });
}



document.addEventListener("DOMContentLoaded", function () {
    const cartData = JSON.parse(document.getElementById("cartData").value);
    const totalAmount = cartData.totalActualAmount;
    console.log(totalAmount);

    let deliveryCharge = totalAmount > 10000 ? 0 : 40;

    document.getElementById("deliveryCharge").textContent = `₹${deliveryCharge}`;

    const totalElement = document.getElementById("totalAmount");
    const newTotal = totalAmount + deliveryCharge;
    totalElement.textContent = `₹${newTotal.toFixed(2)}`;
});

document.getElementById('sameAsDelivery').addEventListener('change', function () {
    const selectedAddress = document.querySelector('input[name="address"]:checked');
    if (this.checked && selectedAddress) {
        const selectedIndex = selectedAddress.value;

        const addressData = document.getElementById(`addressData${selectedIndex}`);
        if (addressData) {
            document.getElementById('name').value = addressData.getAttribute('data-name');
            document.getElementById('phoneNumber').value = addressData.getAttribute('data-phoneNumber');
            document.getElementById('houseAddress').value = addressData.getAttribute('data-homeAddress');
            document.getElementById('landmark').value = addressData.getAttribute('data-landmark');
            document.getElementById('city').value = addressData.getAttribute('data-city');
            document.getElementById('state').value = addressData.getAttribute('data-state');
            document.getElementById('zipCode').value = addressData.getAttribute('data-zipCode');
            document.getElementById('country').value = addressData.getAttribute('data-country');
        }
    } else {
        document.getElementById('name').value = '';
        document.getElementById('phoneNumber').value = '';
        document.getElementById('houseAddress').value = '';
        document.getElementById('landmark').value = '';
        document.getElementById('city').value = '';
        document.getElementById('state').value = '';
        document.getElementById('zipCode').value = '';
        document.getElementById('country').value = '';
    }
});

document.getElementById('placeOrderBtn').addEventListener('click', function () {
    const selectedAddressIndex = document.querySelector('input[name="address"]:checked')?.value;
    const addressData = selectedAddressIndex !== undefined
        ? document.getElementById(`addressData${selectedAddressIndex}`)
        : null;

    const deliveryAddress = addressData
        ? {
            name: addressData.getAttribute('data-name'),
            phoneNumber: addressData.getAttribute('data-phoneNumber'),
            homeAddress: addressData.getAttribute('data-homeAddress'),
            landmark: addressData.getAttribute('data-landmark'),
            city: addressData.getAttribute('data-city'),
            state: addressData.getAttribute('data-state'),
            zipCode: addressData.getAttribute('data-zipCode'),
            country: addressData.getAttribute('data-country'),
        }
        : null;

    const billingDetails = {
        name: document.getElementById('name').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        homeAddress: document.getElementById('houseAddress').value,
        landmark: document.getElementById('landmark').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        country: document.getElementById('country').value,
    };

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.id;

    if (!deliveryAddress) {
        Swal.fire('Error!', 'Please select a delivery address.', 'error');
        return;
    }


    event.preventDefault();

    const homeAddress = document.getElementById('houseAddress').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const name = document.getElementById('name').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const zipCode = document.getElementById('zipCode').value.trim();
    const country = document.getElementById('country').value.trim();

    const errors = {
        houseAddressError: document.getElementById('houseAddressError'),
        landmarkError: document.getElementById('landmarkError'),
        nameError: document.getElementById('nameError'),
        phoneNumberError: document.getElementById('phoneNumberError'),
        cityError: document.getElementById('cityError'),
        stateError: document.getElementById('stateError'),
        zipCodeError: document.getElementById('zipCodeError'),
        countryError: document.getElementById('countryError'),
    };

    for (const key in errors) {
        errors[key].textContent = '';
    }

    let isValid = true;

    if (!homeAddress) {
        errors.houseAddressError.textContent = 'House address is required.';
        isValid = false;
    }
    if (!landmark) {
        errors.landmarkError.textContent = 'Landmark is required.';
        isValid = false;
    }
    if (!name) {
        errors.nameError.textContent = 'Name is required.';
        isValid = false;
    }
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
        errors.phoneNumberError.textContent = 'Enter a valid 10-digit phone number.';
        isValid = false;
    }
    if (!city) {
        errors.cityError.textContent = 'City is required.';
        isValid = false;
    }
    if (!state) {
        errors.stateError.textContent = 'State is required.';
        isValid = false;
    }
    if (!zipCode || !/^\d{6}$/.test(zipCode)) {
        errors.zipCodeError.textContent = 'Enter a valid 6-digit zip code.';
        isValid = false;
    }
    if (!country) {
        errors.countryError.textContent = 'Country is required.';
        isValid = false;
    }

    if (!isValid) return;

    const formData = {

        homeAddress,
        landmark,
        name,
        phoneNumber,
        city,
        state,
        zipCode,
        country,
    };
    if (!paymentMethod) {
        Swal.fire('Error!', 'Please select a payment method.', 'error');
        return;
    }
    const userCart = JSON.parse(document.getElementById('cartData').value);

    const discountAmount = document.getElementById("discountAmount").textContent;
    const totalAmount = document.getElementById("totalAmount").textContent;
    // alert(totalAmount)

    let deliveryChargeText = document.getElementById("deliveryCharge").textContent;
    let deliveryChargeValue = deliveryChargeText.replace("₹", "").trim();
    console.log(deliveryChargeValue);


    const orderData = {
        orderedItem: Object.values(userCart.items).map(item => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
        })),
        totalPrice: userCart.totalPrice,
        discount: userCart.discount || 0,
        couponDiscount: discountAmount || 0,
        finalTotalAmount: (totalAmount || userCart.finalAmount) + deliveryChargeValue,
        deliveryAddress,
        billingDetails,
        paymentMethod,
        status: "pending",
        couponApplied: discountAmount !== "" ? true : false,
        deliveryChargeValue,
    };

    const totalPrice = parseFloat(totalAmount.replace(/[₹,]/g, '').trim()) || userCart.finalAmount;
    // alert(totalPrice)
    if (paymentMethod == "cod") {
        if (totalPrice > 10000) {
            Swal.fire('Error!', 'Cash on delivery only allows purchases below 10,000 Rs.', 'error');
            return;
        }
    }


    if (paymentMethod == "cod" || paymentMethod == "wallet") {
        placeOrder("");
    }

    if (paymentMethod === "upi") {

        fetch('/user/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        }).then(response => response.json())
            .then(data => {
                const options = {
                    key: 'rzp_test_teltatkxHwElFD',
                    amount: data.amount,
                    currency: 'INR',
                    name: 'Your Company Name',
                    description: 'Test Transaction',
                    order_id: data.orderId,
                    handler: function (response) {
                        console.log('Payment successful!');
                        console.log(response);
                        placeOrder(data.orderId);
                    },
                    prefill: {
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        contact: '9037608236',
                    },
                    theme: {
                        color: '#3399cc',
                    },
                };

                const rzp1 = new Razorpay(options);

                rzp1.on('payment.failed', function (response) {
                    console.error('Payment failed:', response.error);
                    // alert("Payment failed")
                    // Redirect to another page on payment failure
                    window.location.href = '/user/payment-failed'; // Replace with your failure page URL
                });
                rzp1.open();

            })
            .catch(error => console.error('Error:', error));
    }

    function placeOrder(paymentId) {
        const paymentIds = paymentId != "" ? paymentId : null;
        orderData.paymentIds = paymentIds
        // console.log(orderData);
        fetch('/user/placeOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire('Success', data.message, 'success')
                        .then(() => {
                            window.location.href = '/user';
                        });

                } else {
                    Swal.fire('Error!', data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error placing order:', error);
                Swal.fire('Error!', 'An error occurred. Please try again.', 'error');
            });
    }
});