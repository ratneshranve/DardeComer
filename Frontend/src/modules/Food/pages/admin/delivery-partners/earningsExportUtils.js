// Export utilities for Delivery Earnings report

const formatCurrencyForExport = (amount) => {
  return Number(amount || 0).toFixed(2);
};

export const exportEarningsToCSV = (earnings, pagination) => {
  const headers = [
    "SI",
    "Delivery Boy",
    "Phone",
    "Order ID",
    "Restaurant",
    "Earning (INR)",
    "Order Total (INR)",
    "Delivery Fee (INR)",
    "Status",
    "Date"
  ];

  const rows = earnings.map((earning, index) => [
    (pagination.page - 1) * pagination.limit + index + 1,
    earning.deliveryPartnerName || 'N/A',
    earning.deliveryPartnerPhone || 'N/A',
    earning.orderId || 'N/A',
    earning.restaurantName || 'N/A',
    formatCurrencyForExport(earning.amount),
    formatCurrencyForExport(earning.orderTotal),
    formatCurrencyForExport(earning.deliveryFee),
    earning.orderStatus || 'N/A',
    new Date(earning.createdAt).toLocaleString('en-IN')
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `delivery_earnings_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportEarningsToExcel = (earnings, pagination) => {
  const headers = [
    "SI",
    "Delivery Boy",
    "Phone",
    "Order ID",
    "Restaurant",
    "Earning",
    "Order Total",
    "Delivery Fee",
    "Status",
    "Date"
  ];

  const rows = earnings.map((earning, index) => [
    (pagination.page - 1) * pagination.limit + index + 1,
    earning.deliveryPartnerName || 'N/A',
    earning.deliveryPartnerPhone || 'N/A',
    earning.orderId || 'N/A',
    earning.restaurantName || 'N/A',
    formatCurrencyForExport(earning.amount),
    formatCurrencyForExport(earning.orderTotal),
    formatCurrencyForExport(earning.deliveryFee),
    earning.orderStatus || 'N/A',
    new Date(earning.createdAt).toLocaleString('en-IN')
  ]);

  const excelContent = [
    headers.join("\t"),
    ...rows.map(row => row.join("\t"))
  ].join("\n");

  const blob = new Blob(["\ufeff", excelContent], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `delivery_earnings_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
};

export const exportEarningsToPDF = async (earnings, pagination) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFontSize(16);
  doc.text("Delivery Earnings Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  const headers = [
    "SI",
    "Delivery Boy",
    "Phone",
    "Order ID",
    "Restaurant",
    "Earning",
    "Order Total",
    "Status",
    "Date"
  ];

  const rows = earnings.map((earning, index) => [
    (pagination.page - 1) * pagination.limit + index + 1,
    earning.deliveryPartnerName || 'N/A',
    earning.deliveryPartnerPhone || 'N/A',
    earning.orderId || 'N/A',
    earning.restaurantName || 'N/A',
    `Rs. ${formatCurrencyForExport(earning.amount)}`,
    `Rs. ${formatCurrencyForExport(earning.orderTotal)}`,
    earning.orderStatus || 'N/A',
    new Date(earning.createdAt).toLocaleDateString('en-IN')
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 10 }, // SI
      5: { halign: 'right' }, // Earning
      6: { halign: 'right' }, // Order Total
    }
  });

  doc.save(`delivery_earnings_${new Date().toISOString().split('T')[0]}.pdf`);
};
