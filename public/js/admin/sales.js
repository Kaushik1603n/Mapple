function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Centered Company Name
    doc.setFontSize(16);
    const companyName = "Mapple";
    const pageWidth = doc.internal.pageSize.width;
    const textWidth = doc.getTextWidth(companyName);
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(companyName, xPosition, 10);

    // Sales Report Title
    doc.setFontSize(14);
    doc.text("Sales Report", 14, 20);
    doc.line(14, 22, 195, 22); // Line under title
    doc.setLineWidth(0.5);

    // Get values from input fields or fallback to 0
    const totalDiscount = parseFloat(document.getElementById("totalDiscount").value) || 0;
    const totalCouponDiscount = parseFloat(document.getElementById("totalCouponDiscount").value) || 0;
    const totalAmount = parseFloat(document.getElementById("totalAmount").value) || 0;

    // AutoTable for Sales Report
    const tableYStart = 30;
    doc.autoTable({
        html: "#salesReportTable",
        startY: tableYStart,
        theme: "grid",
        headStyles: { fillColor: [40, 115, 189] },
    });

    // Position text after the table
    const finalY = doc.lastAutoTable.finalY + 10; // Get the Y-coordinate after the table
    doc.setFontSize(12);
    doc.text(`Total Discount: ${totalDiscount.toFixed(2)}`, 14, finalY);
    doc.text(`Total Coupon Discount: ${totalCouponDiscount.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Total Price: ${totalAmount.toFixed(2)}`, 14, finalY + 20);

    // Footer with report generation date
    const date = new Date();
    const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    doc.setFontSize(10);
    doc.text(`Report Generated on: ${dateString}`, 14, doc.internal.pageSize.height - 20);

    // Save PDF
    doc.save("Sales_Report.pdf");
}

document.querySelector(".btn-primary").addEventListener("click", (e) => {
    e.preventDefault();
    downloadPDF();
});


function downloadExcel() {
    const table = document.getElementById("salesReportTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sales Report" });
    XLSX.writeFile(wb, "Sales_Report.xlsx");
}

document.querySelector(".btn-secondary").addEventListener("click", (e) => {
    e.preventDefault();
    downloadExcel();
});

document.addEventListener("DOMContentLoaded", () => {
    const daySelect = document.getElementById("day");
    const dateRangeContainer = document.getElementById("dateRangeContainer");

    daySelect.addEventListener("change", () => {
        if (daySelect.value === "Custom") {
            dateRangeContainer.style.display = "flex"; // Show the date range inputs
        } else {
            dateRangeContainer.style.display = "none"; // Hide the date range inputs
        }
    });
});

document.getElementById("couponForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the form from submitting

    // Get the selected range and filter
    const day = document.getElementById("day").value;
    const filter = document.getElementById("filter").value;

    // Get the date range if 'Custom' is selected
    let startDate = null;
    let endDate = null;
    if (day === "Custom") {
        startDate = document.getElementById("startDate").value;
        endDate = document.getElementById("endDate").value;
    }

    // Create a data object to send to the server
    const requestData = {
        range: day,
        filter: filter,
        startDate: startDate,
        endDate: endDate,
    };

    console.log("Request Data:", requestData);

    // Make an API call to fetch the report data (Example)
    fetch('/admin/salesReport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
        .then(response => response.json())
        .then(data => {
            console.log("Sales Report Data:", data);
            // Handle the response data
            displaySalesReport(data)
        })
        .catch(error => console.error("Error fetching sales report:", error));
});


function displaySalesReport(data) {
    const tableBody = document.querySelector("#salesReportTable tbody");
    let totalDiscount = 0;
    let totalCouponDiscount = 0;
    let totalAmount = 0;
    tableBody.innerHTML = ""; // Clear existing rows

    if (data.length === 0) {
        const row = `<tr><td colspan="7" class="text-center">No records found</td></tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
        return;
    }

    data.forEach((item, index) => {
        const row = `
    <tr>
        <td>${index + 1}</td>
        <td>${item.orderId || "N/A"}</td>
        <td>${item.orderedItem.productName || "N/A"}</td>
        <td>${item.orderedItem.quantity || 0}</td>
        <td>${item.orderedItem.regularPrice || 0}</td>
        <td>${((item.orderedItem.regularTotal || 0) - (item.orderedItem.total || 0)).toFixed(2)}</td>
        <td>${item.couponDiscount || 0}</td>
        <td>${item.orderedItem.total || 0}</td>
        <td>${new Date(item.createdAt).toLocaleDateString() || "N/A"}</td>
        </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    document.querySelectorAll("#salesReportTable tbody tr").forEach((row) => {
        const discount = parseFloat(row.cells[5].textContent) || 0;
        const couponDiscount = parseFloat(row.cells[6].textContent) || 0;
        const amount = parseFloat(row.cells[7].textContent) || 0;

        totalDiscount += discount;
        totalCouponDiscount += couponDiscount;
        totalAmount += amount;

    });
    document.getElementById("totalDiscount").value = totalDiscount.toFixed(2);
    document.getElementById("totalCouponDiscount").value = totalCouponDiscount.toFixed(2);
    document.getElementById("totalAmount").value = totalAmount.toFixed(2);
}