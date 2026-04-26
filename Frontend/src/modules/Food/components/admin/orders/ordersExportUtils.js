const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

// Export utility functions for orders
export const exportToCSV = (orders, filename = "orders") => {
  // Detect order structure
  const firstOrder = orders[0]
  const isSubscription = firstOrder?.subscriptionId
  const isDispatch = firstOrder?.id && !firstOrder?.orderId
  
  let headers, rows
  
  if (isSubscription) {
    headers = ["SI", "Subscription ID", "Order Type", "Duration", "Restaurant", "Customer Name", "Customer Phone", "Status", "Total Orders", "Delivered"]
    rows = orders.map((order, index) => [
      index + 1,
      order.subscriptionId,
      order.orderType,
      order.duration,
      order.restaurant,
      order.customerName,
      order.customerPhone,
      order.status,
      order.totalOrders,
      order.delivered
    ])
  } else {
    headers = ["SI", "Order ID", "Order Date", "Customer Name", "Customer Phone", "Restaurant", "Price", "Delivery Charge", "Platform Fee", "Total Amount", "Payment Status", "Order Status", "Delivery Type"]
    rows = orders.map((order, index) => {
      const pricing = order.pricing || {}
      return [
        index + 1,
        order.orderId || order.id,
        `${order.date}${order.time ? `, ${order.time}` : ""}`,
        order.customerName,
        order.customerPhone,
        order.restaurant,
        order.subtotal || pricing.subtotal || 0,
        order.deliveryCharge || pricing.deliveryFee || 0,
        order.platformFee || pricing.platformFee || 0,
        order.total || (order.totalAmount || 0).toFixed(2),
        order.paymentStatus || "",
        order.orderStatus || "",
        order.deliveryType || ""
      ]
    })
  }
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToExcel = (orders, filename = "orders") => {
  if (!orders || orders.length === 0) {
    alert("No data to export")
    return
  }

  // Detect order structure
  const firstOrder = orders[0]
  const isSubscription = firstOrder?.subscriptionId
  const isOrderDetectDelivery = firstOrder?.userName && firstOrder?.orderDate // OrderDetectDelivery format
  
  let headers, rows
  
  if (isSubscription) {
    headers = ["SI", "Subscription ID", "Order Type", "Duration", "Restaurant", "Customer Name", "Customer Phone", "Status", "Total Orders", "Delivered"]
    rows = orders.map((order, index) => [
      index + 1,
      order.subscriptionId,
      order.orderType,
      order.duration,
      order.restaurant,
      order.customerName,
      order.customerPhone,
      order.status,
      order.totalOrders,
      order.delivered
    ])
  } else if (isOrderDetectDelivery) {
    // OrderDetectDelivery format - includes delivery boy info and payment details
    headers = ["SI", "Order ID", "Order Date", "Order Time", "Customer Name", "Customer Phone", "Restaurant Name", "Delivery Boy Name", "Delivery Boy Phone", "Status", "Total Amount", "Payment Status"]
    rows = orders.map((order, index) => {
      const originalOrder = order.originalOrder || {}
      const totalAmount = originalOrder.pricing?.total || originalOrder.totalAmount || originalOrder.total || 0
      const paymentStatus = originalOrder.payment?.status || originalOrder.paymentStatus || 'N/A'
      
      return [
        order.sl || index + 1,
        order.orderId || 'N/A',
        order.orderDate || 'N/A',
        order.orderTime || 'N/A',
        order.userName || 'N/A',
        order.userNumber || 'N/A',
        order.restaurantName || 'N/A',
        order.deliveryBoyName || 'N/A',
        order.deliveryBoyNumber || 'N/A',
        order.status || 'N/A',
        totalAmount > 0 ? `Rs. ${totalAmount.toFixed(2)}` : 'N/A',
        paymentStatus
      ]
    })
  } else {
    headers = ["SI", "Order ID", "Order Date", "Customer Name", "Customer Phone", "Restaurant", "Price", "Delivery Charge", "Platform Fee", "Total Amount", "Payment Status", "Order Status", "Delivery Type"]
    rows = orders.map((order, index) => {
      const pricing = order.pricing || {}
      return [
        index + 1,
        order.orderId || order.id,
        `${order.date || ''}${order.time ? `, ${order.time}` : ""}`,
        order.customerName || 'N/A',
        order.customerPhone || 'N/A',
        order.restaurant || 'N/A',
        order.subtotal || pricing.subtotal || 0,
        order.deliveryCharge || pricing.deliveryFee || 0,
        order.platformFee || pricing.platformFee || 0,
        order.total || (order.totalAmount || 0).toFixed(2),
        order.paymentStatus || 'N/A',
        order.orderStatus || 'N/A',
        order.deliveryType || 'N/A'
      ]
    })
  }
  
  // Helper function to escape HTML and format cell values
  const escapeHtml = (value) => {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  // Create HTML table for better Excel compatibility with UTF-8 encoding
  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { 
            border-collapse: collapse; 
            width: 100%; 
            font-family: Arial, sans-serif;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #3b82f6; 
            color: white; 
            font-weight: bold; 
            text-align: center;
          }
          td { 
            white-space: nowrap; 
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `
  
  const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportToPDF = async (orders, filename = "orders") => {
  if (!orders || orders.length === 0) {
    alert("No data to export")
    return
  }

  try {
    // Dynamic import of jsPDF and autoTable for instant download
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    
    // Detect order structure
    const firstOrder = orders[0]
    const isSubscription = firstOrder?.subscriptionId
    const isOrderDetectDelivery = firstOrder?.userName && firstOrder?.orderDate // OrderDetectDelivery format
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Header Colors
    const primaryColor = [30, 41, 59] // Slate 800
    const secondaryColor = [100, 116, 139] // Slate 500
    
    // Add Brand Header
    doc.setFontSize(22)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text("DARDECOMER", 14, 20)
    
    doc.setFontSize(14)
    const title = (filename.charAt(0).toUpperCase() + filename.slice(1).replace(/_/g, ' ')) + " Report"
    doc.text(title, 14, 30)
    
    // Add export info
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    const exportDate = new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Generated on: ${exportDate}`, 14, 36)
    doc.text(`Total Records: ${orders.length}`, 14, 41)
    
    let headers, tableData, columnStyles = {}
    
    if (isSubscription) {
      headers = [["SI", "Subscription ID", "Order Type", "Duration", "Restaurant", "Customer Name", "Customer Phone", "Status", "Total Orders", "Delivered"]]
      tableData = orders.map((order, index) => [
        index + 1,
        order.subscriptionId || 'N/A',
        order.orderType || 'N/A',
        order.duration || 'N/A',
        order.restaurant || 'N/A',
        order.customerName || 'N/A',
        order.customerPhone || 'N/A',
        order.status || 'N/A',
        order.totalOrders || 0,
        order.delivered || 'N/A'
      ])
    } else if (isOrderDetectDelivery) {
      headers = [["SI", "Order ID", "Date", "Customer", "Phone", "Restaurant", "Rider", "Status", "Amount", "P. Status"]]
      tableData = orders.map((order, index) => {
        const originalOrder = order.originalOrder || {}
        const totalAmount = originalOrder.pricing?.total || originalOrder.totalAmount || originalOrder.total || 0
        const paymentStatus = originalOrder.payment?.status || originalOrder.paymentStatus || 'N/A'
        
        return [
          order.sl || index + 1,
          order.orderId || 'N/A',
          `${order.orderDate || ''} ${order.orderTime || ''}`,
          order.userName || 'N/A',
          order.userNumber || 'N/A',
          order.restaurantName || 'N/A',
          order.deliveryBoyName || 'N/A',
          order.status || 'N/A',
          totalAmount > 0 ? `Rs. ${totalAmount.toFixed(2)}` : 'N/A',
          paymentStatus
        ]
      })
      columnStyles = {
        8: { halign: 'right' }
      }
    } else {
      headers = [["SI", "Order ID", "Date", "Customer", "Restaurant", "Price", "D.Charge", "P.Fee", "Total", "P. Method", "P. Status", "O. Status"]]
      tableData = orders.map((order, index) => {
        const pricing = order.pricing || {}
        const subtotal = order.subtotal ?? pricing.subtotal ?? 0
        const deliveryCharge = order.deliveryCharge ?? pricing.deliveryFee ?? 0
        const platformFee = order.platformFee ?? pricing.platformFee ?? 0
        const total = order.totalAmount ?? order.total ?? pricing.total ?? 0
        const paymentMethod = order.paymentMethod || order.payment?.method || 'N/A'
        const paymentStatus = order.paymentStatus || order.payment?.status || 'N/A'

        return [
          index + 1,
          order.orderId || order.id || 'N/A',
          `${order.date || ''}${order.time ? `\n${order.time}` : ""}` || 'N/A',
          `${order.customerName || 'N/A'}\n${order.customerPhone || ''}`,
          order.restaurant || 'N/A',
          subtotal ? `Rs. ${Number(subtotal).toFixed(2)}` : 'Rs. 0.00',
          deliveryCharge ? `Rs. ${Number(deliveryCharge).toFixed(2)}` : 'Rs. 0.00',
          platformFee ? `Rs. ${Number(platformFee).toFixed(2)}` : 'Rs. 0.00',
          total ? `Rs. ${Number(total).toFixed(2)}` : 'Rs. 0.00',
          paymentMethod,
          paymentStatus,
          order.orderStatus || 'N/A'
        ]
      })
      columnStyles = {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' }
      }
    }

    // Add table using autoTable
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: 48,
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        overflow: 'linebreak',
        font: 'helvetica'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        textColor: [50, 50, 50],
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // SI
        1: { cellWidth: 22 }, // Order ID
        2: { cellWidth: 22 }, // Date
        ...columnStyles
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8)
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        const pageCount = doc.internal.getNumberOfPages()
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber
        doc.text(`Page ${pageCurrent} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)
        doc.text("DardeComer - Order Management System", doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' })
      }
    })

    // Calculate Summary
    if (!isSubscription) {
      const finalY = doc.lastAutoTable.finalY + 10
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total || o.pricing?.total || 0)), 0)
      
      // Check if we have space for summary, otherwise add new page
      if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage()
        doc.setPage(doc.internal.getNumberOfPages())
      }

      const summaryX = doc.internal.pageSize.width - 80
      doc.setFontSize(12)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text("Financial Summary", summaryX, finalY)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Orders:`, summaryX, finalY + 8)
      doc.text(`${orders.length}`, doc.internal.pageSize.width - 14, finalY + 8, { align: 'right' })
      
      doc.text(`Total Revenue:`, summaryX, finalY + 14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Rs. ${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.internal.pageSize.width - 14, finalY + 14, { align: 'right' })
      
      // Signature / Footer Line
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(0.5)
      doc.line(14, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 20)
    }

    // Save the PDF instantly
    const fileTimestamp = new Date().toISOString().split("T")[0]
    doc.save(`${filename}_${fileTimestamp}.pdf`)
  } catch (error) {
    debugError("Error loading PDF library:", error)
    alert("Failed to load PDF library. Please try again.")
  }
}

export const exportToJSON = (orders, filename = "orders") => {
  const jsonContent = JSON.stringify(orders, null, 2)
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
