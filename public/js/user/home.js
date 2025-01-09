document.addEventListener("DOMContentLoaded", () => {
    const likeButtons = document.querySelectorAll(".like-btn");

    const likedProducts = {};

    likeButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const productId = event.target.closest(".like-btn").getAttribute("data-id");
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

            console.log(`ProductId : ${productId} liked: ${likedProducts[productId]}`);

            fetch("/user/wishlist", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    liked: isLiked
                }),
            })
                .then(response => {
                    return response.json().then(data => {
                        if (response.ok) {
                            console.log("Success: " + data.message);
                        } else {
                            alert("Failed: " + data.error || "An error occurred");
                        }
                    });
                }).catch(error => {
                    console.error('Error:', error);
                    alert("Failed: Network error or server unavailable.");

                });
        });
    });
});
