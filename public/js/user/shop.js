document.addEventListener("DOMContentLoaded", () => {
  const productsContainer = document.getElementById("productsContainer");
  const paginationContainer = document.getElementById("pagination");
  const searchForm = document.getElementById("searchForm");
  const sortSelect = document.getElementById("sortSelect");
  const variantCheckboxes = document.querySelectorAll(".variant-checkbox"); // Ensure this matches the updated class name
  const categoryCheckboxes = document.querySelectorAll(".category-checkbox"); // Ensure this matches the updated class name
  const priceCheckboxes = document.querySelectorAll(".priceRange-checkbox"); // Ensure this matches the updated class name

  let filters = {
    search: "",
    sortOption: "new",
    variant: [],
    category: [],
    priceRange: [],
    page: 1,
  };

  const fetchProducts = async () => {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`/user/shopData?${query}`);
    const data = await response.json();
    renderProducts(data.products);
    renderPagination(data.currentPage, data.totalPages);
  };

  const renderProducts = (products) => {
    productsContainer.innerHTML = products
      .map(
        (product) => `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="card border-0 shadow-lg text-center">
                        <img src="${
                          product.productImage[0]
                        }" class="card-img-top mx-auto pt-3 p-1" alt="${
          product.productName
        }">
                        <div class="card-body">
                            <h5 class="card-title">${product.productName} ${
          product.variant
        }</h5>
                            <p class="text-muted mb-2"><span>&#8377;</span> ${product.salePrice.toLocaleString()}</p>
                            <a href="/user/productDetails/${
                              product._id
                            }" class="btn btn-dark w-100">Buy Now</a>
                        </div>
                    </div>
                </div>`
      )
      .join("");
  };

  const renderPagination = (currentPage, totalPages) => {
    let paginationHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
                <li class="page-item ${i == currentPage ? "active" : ""}">
                    <button class="page-link" data-page="${i}">${i}</button>
                </li>`;
    }
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = paginationHTML;
  };

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    filters.search = document.getElementById("searchInput").value;
    filters.page = 1;
    fetchProducts();
  });

  sortSelect.addEventListener("change", (e) => {
    filters.sortOption = e.target.value;
    filters.page = 1;
    fetchProducts();
  });

  variantCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      filters.variant = Array.from(variantCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      filters.page = 1;
      fetchProducts();
    });
  });
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      filters.category = Array.from(categoryCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      filters.page = 1;
      fetchProducts();
    });
  });
  priceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      filters.priceRange = Array.from(priceCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      filters.page = 1;
      fetchProducts();
    });
  });

  // Event: Pagination click
  paginationContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("page-link")) {
      filters.page = +e.target.dataset.page;
      fetchProducts();
    }
  });

  fetchProducts(); // Initial fetch
});
