// const timeFilter = document.getElementById('time-filter');
// const combinedChartCanvas = document.getElementById('combinedChart');

// // Initialize Combined Chart
// let combinedChart = new Chart(combinedChartCanvas, {
//     type: 'line',
//     data: {
//         labels: [], // Labels will be dynamically set
//         datasets: [
//             {
//                 label: 'Total Sales',
//                 data: [], // Data will be dynamically set
//                 borderColor: 'rgba(75, 192, 192, 1)',
//                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
//                 fill: true,
//             },
//             {
//                 label: 'Total Discount',
//                 data: [], // Data will be dynamically set
//                 borderColor: 'rgba(255, 99, 132, 1)',
//                 backgroundColor: 'rgba(255, 99, 132, 0.2)',
//                 fill: true,
//             },
//         ],
//     },
//     options: {
//         responsive: true,
//         scales: {
//             x: { // Time-related axis
//                 ticks: { beginAtZero: true },
//             },
//             y: {
//                 beginAtZero: true,
//             },
//         },
//     },
// });

// async function fetchSalesAndDiscountData(filter) {
//     // Fetch both sales and discount data concurrently
//     const [salesResponse, discountResponse] = await Promise.all([
//         fetch(`/admin/sales-data?filter=${filter}`),
//         fetch(`/admin/discount-data?filter=${filter}`),
//     ]);

//     // Parse responses as JSON
//     const salesData = await salesResponse.json();
//     const discountData = await discountResponse.json();

//     // Prepare chart labels based on the filter type
//     let labels = [];
//     if (filter === 'daily') {
//         labels = salesData.map(data => `Day ${data._id.dayOfYear}`);
//     } else if (filter === 'weekly') {
//         labels = salesData.map(data => `Week ${data._id.isoWeek}`);
//     } else if (filter === 'monthly') {
//         labels = salesData.map(data => `${data._id.year} Month ${data._id.month}`);
//     } else if (filter === 'yearly') {
//         labels = salesData.map(data => `Year ${data._id}`);
//     }

//     // Extract data for sales and discounts
//     const sales = salesData.map(data => data.totalSales);
//     const discounts = discountData.map(data => data.totalDiscount);

//     // Update chart
//     combinedChart.data.labels = labels;
//     combinedChart.data.datasets[0].data = sales; // Total Sales
//     combinedChart.data.datasets[1].data = discounts; // Total Discounts
//     combinedChart.update();
// }

// // Initial data fetch for 'daily'
// fetchSalesAndDiscountData('daily');

// // Listen for filter changes and update chart
// timeFilter.addEventListener('change', (e) => {
//     fetchSalesAndDiscountData(e.target.value);
// });

// async function fetchLedgerData() {
//     try {
//         const response = await fetch("/admin/ledger-data");
//         if (!response.ok) throw new Error("Failed to fetch ledger data");

//         const ledgerData = await response.json();

//         // Process and display data
//         console.log(ledgerData);
//         renderLedgerTable(ledgerData);
//     } catch (error) {
//         console.error("Error fetching ledger data:", error);
//     }
// }

// function renderLedgerTable(data) {
//     const table = document.getElementById("ledgerTableBody");
//     table.innerHTML = "";

//     data.forEach((entry) => {
//         const row = document.createElement("tr");

//         const yearCell = document.createElement("td");
//         yearCell.textContent = entry._id.year;

//         const monthCell = document.createElement("td");
//         monthCell.textContent = new Date(0, entry._id.month - 1).toLocaleString(
//             "en-US",
//             { month: "long" }
//         );

//         const salesCell = document.createElement("td");
//         salesCell.textContent = entry.totalSales.toFixed(2);

//         row.appendChild(yearCell);
//         row.appendChild(monthCell);
//         row.appendChild(salesCell);

//         table.appendChild(row);
//     });
// }

// function downloadExcel() {
//     const table = document.getElementById('ledgerTable');
//     const wb = XLSX.utils.table_to_book(table, { sheet: 'Ledger Book' });
//     XLSX.writeFile(wb, 'LedgerBook.xlsx');
// }

// async function downloadPDF() {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();

//     // Add title
//     doc.setFontSize(18);
//     doc.text('Ledger Book', 105, 10, { align: 'center' });

//     // Get table element
//     const table = document.getElementById('ledgerTable');

//     // Convert table to data
//     const data = [];
//     const rows = table.querySelectorAll('tr');
//     rows.forEach(row => {
//         const cols = row.querySelectorAll('th, td');
//         const rowData = [];
//         cols.forEach(col => rowData.push(col.innerText));
//         data.push(rowData);
//     });

//     doc.autoTable({
//         head: [data[0]], // First row as header
//         body: data.slice(1), // Rest of the rows as body
//         startY: 20,
//     });

//     doc.save('LedgerBook.pdf');
// }

