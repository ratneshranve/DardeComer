// Export utility functions for reports
export const exportReportsToCSV = (data, headers, filename = "report") => {
  const rows = data.map((item, index) => {
    return headers.map(header => {
      const key = typeof header === 'string' ? header : header.key
      let value = item[key]
      
      // Automatic Serial Number handling
      if ((key === 'sl' || key === 'si' || key === 'SI' || key === 'SL') && (value === undefined || value === null)) {
        value = index + 1
      }
      
      if (value === null || value === undefined) value = ""
      return typeof value === 'object' ? JSON.stringify(value) : value
    })
  })
  
  const headerRow = headers.map(h => typeof h === 'string' ? h : h.label).join(",")
  const csvContent = [
    headerRow,
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n")
  
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportReportsToExcel = (data, headers, filename = "report") => {
  const rows = data.map((item, index) => {
    return headers.map(header => {
      const key = typeof header === 'string' ? header : header.key
      let value = item[key]
      
      // Automatic Serial Number handling
      if ((key === 'sl' || key === 'si' || key === 'SI' || key === 'SL') && (value === undefined || value === null)) {
        value = index + 1
      }
      
      if (value === null || value === undefined) value = ""
      return typeof value === 'object' ? JSON.stringify(value) : value
    })
  })
  
  const headerRow = headers.map(h => typeof h === 'string' ? h : h.label).join("\t")
  const excelContent = [
    headerRow,
    ...rows.map(row => row.join("\t"))
  ].join("\n")
  
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\ufeff", excelContent], { type: "application/vnd.ms-excel" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportReportsToPDF = async (data, headers, filename = "report", title = "Report") => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  
  const isLandscape = headers.length > 7
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  doc.setFontSize(16)
  doc.text(title, 14, 15)
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
  
  const headerLabels = headers.map(h => typeof h === 'string' ? h : h.label)
  const rows = data.map((item, index) => {
    return headers.map(header => {
      const key = typeof header === 'string' ? header : header.key
      let value = item[key]
      
      // Automatic Serial Number handling
      if ((key === 'sl' || key === 'si' || key === 'SI' || key === 'SL') && (value === undefined || value === null)) {
        value = index + 1
      }
      
      if (value === null || value === undefined) value = ""
      return String(value)
    })
  })
  
  autoTable(doc, {
    head: [headerLabels],
    body: rows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export const exportReportsToJSON = (data, filename = "report") => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Specific export functions for Transaction Report
export const exportTransactionReportToCSV = (transactions, filename = "transaction_report") => {
  const headers = ["SI", "Order ID", "Restaurant", "Customer Name", "Total Item Amount", "Coupon Discount", "VAT/Tax", "Delivery Charge", "Platform Fee", "Order Amount"]
  const rows = transactions.map((transaction, index) => [
    index + 1,
    transaction.orderId,
    transaction.restaurant,
    transaction.customerName,
    transaction.totalItemAmount.toFixed(2),
    transaction.couponDiscount.toFixed(2),
    transaction.vatTax.toFixed(2),
    transaction.deliveryCharge.toFixed(2),
    Number(transaction.platformFee || 0).toFixed(2),
    transaction.orderAmount.toFixed(2)
  ])
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")
  
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportTransactionReportToExcel = (transactions, filename = "transaction_report") => {
  const headers = ["SI", "Order ID", "Restaurant", "Customer Name", "Total Item Amount", "Coupon Discount", "VAT/Tax", "Delivery Charge", "Platform Fee", "Order Amount"]
  const rows = transactions.map((transaction, index) => [
    index + 1,
    transaction.orderId,
    transaction.restaurant,
    transaction.customerName,
    transaction.totalItemAmount.toFixed(2),
    transaction.couponDiscount.toFixed(2),
    transaction.vatTax.toFixed(2),
    transaction.deliveryCharge.toFixed(2),
    Number(transaction.platformFee || 0).toFixed(2),
    transaction.orderAmount.toFixed(2)
  ])
  
  const excelContent = [
    headers.join("\t"),
    ...rows.map(row => row.join("\t"))
  ].join("\n")
  
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\ufeff", excelContent], { type: "application/vnd.ms-excel" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportTransactionReportToPDF = async (transactions, filename = "transaction_report") => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  doc.setFontSize(16)
  doc.text("Transaction Report", 14, 15)
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
  
  const headers = ["SI", "Order ID", "Restaurant", "Customer Name", "Total Item Amount", "Coupon Discount", "VAT/Tax", "Delivery Charge", "Platform Fee", "Order Amount"]
  
  const rows = transactions.map((transaction, index) => [
    index + 1,
    transaction.orderId,
    transaction.restaurant,
    transaction.customerName,
    `Rs. ${transaction.totalItemAmount.toFixed(2)}`,
    `Rs. ${transaction.couponDiscount.toFixed(2)}`,
    `Rs. ${transaction.vatTax.toFixed(2)}`,
    `Rs. ${transaction.deliveryCharge.toFixed(2)}`,
    `Rs. ${Number(transaction.platformFee || 0).toFixed(2)}`,
    `Rs. ${transaction.orderAmount.toFixed(2)}`
  ])
  
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export const exportTransactionReportToJSON = (transactions, filename = "transaction_report") => {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
