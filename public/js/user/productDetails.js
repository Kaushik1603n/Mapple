document.addEventListener("DOMContentLoaded", () => {
  const likeButtons = document.querySelectorAll(".like-btn");

  const likedProducts = {};

  likeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const productId = event.target
        .closest(".like-btn")
        .getAttribute("data-id");
      const likeIcon = button.querySelector(".like-icon");

      // if (likedProducts[productId]) {
      //     likedProducts[productId] = false;
      //     likeIcon.textContent = "♡";
      //     likeIcon.style.color = "";
      // } else {
      //     likedProducts[productId] = true;
      //     likeIcon.textContent = "♥";
      //     likeIcon.style.color = "red";
      // }

      const isLiked = !likedProducts[productId];
      likedProducts[productId] = isLiked;

      likeIcon.textContent = isLiked ? "♥" : "♡";
      likeIcon.style.color = isLiked ? "red" : "";

      console.log(
        `ProductId : ${productId} liked: ${likedProducts[productId]}`
      );

      fetch("/user/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          liked: isLiked,
        }),
      })
        .then((response) => {
          return response.json().then((data) => {
            if (response.ok) {
              console.log("Success: " + data.message);
            } else {
              alert("Failed: " + data.error || "An error occurred");
            }
          });
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed: Network error or server unavailable.");
        });
    });
  });
});

function switchToSlide(slideIndex) {
  const carousel = new bootstrap.Carousel("#productCarousel");
  carousel.to(slideIndex);
}

const decreaseButton = document.getElementById("decreaseButton");
const increaseButton = document.getElementById("increaseButton");
const quantityInput = document.getElementById("quantityInput");

const productQuantityText =
  document.getElementById("productQuantity").innerText;
const productQuantity = parseInt(productQuantityText.replace("Left: ", ""), 10);
let quantity = 1;

decreaseButton.addEventListener("click", function () {
  // if (productQuantity >= quantity) {
  if (quantity > 1) {
    quantity--;
    quantityInput.value = quantity;
  }
  // }
});

increaseButton.addEventListener("click", function () {
  if (productQuantity > quantity) {
    if (productQuantity) {
      quantity++;
      quantityInput.value = quantity;
    }
  }
});

const storageButtons = document.querySelectorAll("button[data-storage]");
storageButtons.forEach((button) => {
  button.addEventListener("click", function () {
    storageButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const selectedStorage = button.getAttribute("data-storage");
    console.log("Selected Storage:", selectedStorage);
  });
});

const colorBadges = document.querySelectorAll(".badge");
colorBadges.forEach((badge) => {
  badge.addEventListener("click", function () {
    colorBadges.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    const selectedColor = this.getAttribute("data-color");
    console.log("Selected Color:", selectedColor);
  });
});

function updateProductDetails(color, variant) {
  const url = new URL(window.location.href);
  if (color) url.searchParams.set("color", color);
  if (variant) url.searchParams.set("variant", variant);
  window.location.href = url.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  const badges = document.querySelectorAll(".colorBadge");

  badges.forEach((badge) => {
    const color = badge.getAttribute("data-color");
    badge.style.backgroundColor = color;
  });
});

function applyZoom(wrapper) {
  wrapper.addEventListener("mousemove", (e) => {
    const img = wrapper.querySelector(".carousel-item.active .zoom-image");
    if (!img) return;

    const rect = wrapper.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  });

  wrapper.addEventListener("mouseenter", () => {
    const img = wrapper.querySelector(".carousel-item.active .zoom-image");
    if (img) img.classList.add("zoomed");
  });

  wrapper.addEventListener("mouseleave", () => {
    const img = wrapper.querySelector(".carousel-item.active .zoom-image");
    if (img) img.classList.remove("zoomed");
  });
}

function initializeZoomCarousel() {
  const zoomWrappers = document.querySelectorAll(".zoom-wrapper");

  zoomWrappers.forEach((wrapper) => {
    applyZoom(wrapper);

    const carousel = wrapper.querySelector(".carousel");
    if (carousel) {
      carousel.addEventListener("slid.bs.carousel", () => {
        wrapper.querySelectorAll(".zoom-image").forEach((img) => {
          img.style.transformOrigin = "";
          img.classList.remove("zoomed");
        });
      });
    }
  });
}

initializeZoomCarousel();

document.addEventListener("DOMContentLoaded", () => {
  const addToCartButton = document.getElementById("addToCartButton");
  const quantityInput = document.getElementById("quantityInput");
  const addToWishlist = document.getElementById("addToWishlistButton");

  if (addToCartButton) {
    addToCartButton.addEventListener("click", () => {
      const productId = addToCartButton.getAttribute("data-product-id");
      const quantity = parseInt(quantityInput.value, 10);

      if (!productId || quantity <= 0) {
        Swal.fire({
          title: "Invalid Input!",
          text: "Invalid product or quantity.",
          icon: "warning",
          confirmButtonText: "OK",
        });

        return;
      }

      const cartData = {
        productId: productId,
        quantity: quantity,
      };

      fetch("/user/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      })
        .then((response) => {
          console.log(`Response Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          console.log("Response Data:", data);
          if (data.success) {
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
        })
        .catch((err) => {
          console.error("Error adding product to cart:", err);
          Swal.fire({
            title: "Error!",
            text: "Something went wrong. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.href = window.location.href;
          });
        });
    });
  }

  if (addToWishlist) {
    addToWishlist.addEventListener("click", () => {
      const productId = addToWishlist.getAttribute("data-id");

      fetch("/user/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          liked: true,
        }),
      })
        .then((response) => {
          return response.json().then((data) => {
            if (response.ok) {
              console.log("Success: " + data.message);
            } else {
              alert("Failed: " + data.error || "An error occurred");
            }
          });
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed: Network error or server unavailable.");
        });
    });
  }
});
