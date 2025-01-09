async function getWishlistItems() {
  try {
    const response = await fetch("/user/wishlistItems");
    if (!response.ok) throw new Error("Failed to fetch wishlistItems data");

    const result = await response.json();

    // Process and display data
    console.log(result.allProduct);
    renderwishlistTable(result.allProduct);
  } catch (error) {
    console.error("Error fetching wishlist data:", error);
  }
}

function renderwishlistTable(products) {
  const tableBody = document.querySelector("#wishlistTable tbody");
  tableBody.innerHTML = "";

  if (!products || products.length === 0) {
    const row = `<tr><td colspan="6" class="text-center">No records found</td></tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
    return;
  }

  products.forEach((product) => {
    // console.log(product);

    const productImage =
      product.productImage && product.productImage.length > 0
        ? `<img src="${product.productImage[0]}" alt="Product Image" style="width: 50px;">`
        : "N/A";

    const row = `
            <tr>
              <td>${productImage}</td>
              <td>${product.productName || "N/A"}</td>
              <td>${product.status || "N/A"}</td>
              <td>${product.salePrice || "N/A"}</td>
              <td>
                <button class="btn btn-primary btn-sm addToCartButton" 
                        id="addToCartButton" 
                        data-product-id="${product._id}">
                  Add to Cart
                </button>
              </td>
              <td>
                <button class="btn btn-danger btn-sm remove-btn" 
                        data-id="${product._id}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("#wishlistTable")
    .addEventListener("click", async (event) => {
      if (event.target.closest(".remove-btn")) {
        const productId = event.target
          .closest(".remove-btn")
          .getAttribute("data-id");

        try {
          const response = await fetch(`/user/removeproduct/${productId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "Product removed successfully!",
              showConfirmButton: false,
              timer: 1500, // The popup will close after 1.5 seconds
            });
            getWishlistItems();
          } else {
            Swal.fire({
              icon: "error",
              title: "Failed to remove product.",
              showConfirmButton: true,
            });
          }
        } catch (error) {
          console.error("Error removing product:", error);
          Swal.fire({
            icon: "error",
            title: "Something went wrong!",
            text: error.message,
            showConfirmButton: true,
          });
        }
      }
    });
});

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("#wishlistTable")
    .addEventListener("click", async (event) => {
      if (event.target.closest(".addToCartButton")) {
        const button = event.target.closest(".addToCartButton");
        const productId = button.getAttribute("data-product-id");
        const defaultQuantity = 1;

        if (!productId || defaultQuantity <= 0) {
          Swal.fire({
            title: "Invalid Input!",
            text: "Invalid product or quantity.",
            icon: "warning",
            confirmButtonText: "OK",
          });
          return;
        }

        const cartData = {
          productId,
          quantity: defaultQuantity,
        };

        try {
          const response = await fetch("/user/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cartData),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            Swal.fire({
              title: "Success!",
              text: "Product added to cart successfully!",
              icon: "success",
              confirmButtonText: "OK",
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: data.message || "Failed to add product to cart.",
              icon: "error",
              confirmButtonText: "Try Again",
            });
          }
        } catch (err) {
          console.error("Error adding product to cart:", err);
          Swal.fire({
            title: "Error!",
            text: "Something went wrong. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.reload(); // Reload the page in case of error
          });
        }
      }
    });
});

getWishlistItems();
