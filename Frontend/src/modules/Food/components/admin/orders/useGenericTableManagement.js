import { useState, useMemo, useEffect } from "react"
import { exportToExcel, exportToPDF } from "./ordersExportUtils"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export function useGenericTableManagement(data, title, searchFields = []) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filters, setFilters] = useState({})
  const [visibleColumns, setVisibleColumns] = useState({})

  // Apply search
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search query
    if (searchQuery.trim() && searchFields.length > 0) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(item => 
        searchFields.some(field => {
          const value = item[field]
          return value && value.toString().toLowerCase().includes(query)
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        result = result.filter(item => {
          const itemValue = item[key]
          if (typeof value === 'string') {
            return itemValue === value || itemValue?.toString().toLowerCase() === value.toLowerCase()
          }
          return itemValue === value
        })
      }
    })

    return result
  }, [data, searchQuery, filters, searchFields])

  const count = filteredData.length

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== "" && value !== null && value !== undefined).length
  }, [filters])

  const handleApplyFilters = () => {
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    setFilters({})
  }

  const handleExport = async (format) => {
    const filename = title.toLowerCase().replace(/\s+/g, "_")
    switch (format) {
      case "excel":
        exportToExcel(filteredData, filename)
        break
      case "pdf":
        await exportToPDF(filteredData, filename)
        break
      default:
        break
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsViewOrderOpen(true)
  }

  const handlePrintOrder = async (order) => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Use original order if available for more detailed data
      const source = order.originalOrder || order
      const orderId = source.orderId || source.id || source.subscriptionId || 'N/A'
      const customerName = source.customerName || order.userName || source.userId?.name || 'Unknown'
      const customerPhone = source.customerPhone || order.userNumber || source.userId?.phone || 'N/A'
      const restaurantName = source.restaurantName || source.restaurantId?.restaurantName || order.restaurantName || 'Unknown Restaurant'
      const restaurantAddress = source.restaurantId?.address || 'N/A'
      const deliveryBoyName = order.deliveryBoyName || source.deliveryPartnerName || 'N/A'
      const deliveryBoyPhone = order.deliveryBoyNumber || source.deliveryPartnerPhone || 'N/A'
      const items = source.cart?.items || source.items || []
      const totalAmount = source.orderAmount || source.totalAmount || 0
      const paymentStatus = source.paymentStatus || 'N/A'
      const orderStatus = source.orderStatus || source.status || 'N/A'
      const date = source.createdAt ? new Date(source.createdAt).toLocaleString() : (order.orderDate + " " + order.orderTime)

      // Color Palette
      const primaryColor = [37, 99, 235] // blue-600 (Theme Color)
      const secondaryColor = [71, 85, 105] // slate-600
      const textColor = [30, 41, 59] // slate-800

      // Header
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, 210, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont(undefined, 'bold')
      doc.text('INVOICE', 14, 25)
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Order ID: #${orderId}`, 14, 32)
      doc.text(`Date: ${date}`, 140, 32)

      let startY = 50

      // Information Sections
      doc.setTextColor(...textColor)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Customer Details', 14, startY)
      doc.text('Restaurant Details', 110, startY)
      
      startY += 6
      doc.setDrawColor(226, 232, 240)
      doc.line(14, startY, 100, startY)
      doc.line(110, startY, 196, startY)
      
      startY += 6
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(...secondaryColor)
      
      // Customer Info
      doc.text(`Name: ${customerName}`, 14, startY)
      doc.text(`Phone: ${customerPhone}`, 14, startY + 5)
      if (source.deliveryAddress) {
        const addr = source.deliveryAddress
        const addrText = `${addr.address || ""}, ${addr.city || ""}`
        const splitAddr = doc.splitTextToSize(addrText, 80)
        doc.text(splitAddr, 14, startY + 10)
      }

      // Restaurant Info
      doc.text(`Name: ${restaurantName}`, 110, startY)
      const splitRestAddr = doc.splitTextToSize(`Address: ${restaurantAddress}`, 80)
      doc.text(splitRestAddr, 110, startY + 5)
      
      startY += 25

      // Delivery Partner info if exists
      if (deliveryBoyName !== 'N/A') {
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(...textColor)
        doc.text('Delivery Partner', 14, startY)
        startY += 5
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(...secondaryColor)
        doc.text(`${deliveryBoyName} (${deliveryBoyPhone})`, 14, startY)
        startY += 10
      }

      // Items Table
      if (items.length > 0) {
        const tableData = items.map((item, index) => [
          index + 1,
          item.foodName || item.name || 'Item',
          item.quantity || 1,
          `Rs. ${(item.price || 0).toFixed(2)}`,
          `Rs. ${((item.quantity || 1) * (item.price || 0)).toFixed(2)}`
        ])

        autoTable(doc, {
          startY: startY,
          head: [['#', 'Item', 'Qty', 'Price', 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          },
          styles: {
            fontSize: 9,
            cellPadding: 4
          },
          margin: { left: 14, right: 14 }
        })
        
        startY = doc.lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(10)
        doc.text('No items data available in this view.', 14, startY)
        startY += 10
      }

      // Summary
      const summaryX = 140
      doc.setFontSize(10)
      doc.setTextColor(...secondaryColor)
      
      if (source.itemTotal) {
        doc.text('Item Total:', summaryX, startY)
        doc.text(`Rs. ${source.itemTotal.toFixed(2)}`, 196, startY, { align: 'right' })
        startY += 5
      }
      
      if (source.deliveryFee) {
        doc.text('Delivery Fee:', summaryX, startY)
        doc.text(`Rs. ${source.deliveryFee.toFixed(2)}`, 196, startY, { align: 'right' })
        startY += 5
      }

      if (source.taxAmount) {
        doc.text('Tax:', summaryX, startY)
        doc.text(`Rs. ${source.taxAmount.toFixed(2)}`, 196, startY, { align: 'right' })
        startY += 5
      }

      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(summaryX, startY, 196, startY)
      startY += 7

      doc.setFontSize(14)
      doc.setTextColor(...textColor)
      doc.setFont(undefined, 'bold')
      doc.text('Grand Total:', summaryX, startY)
      doc.text(`Rs. ${(totalAmount).toFixed(2)}`, 196, startY, { align: 'right' })
      
      startY += 15

      // Footer Info
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('Order Details', 14, startY)
      startY += 6
      doc.setFont(undefined, 'normal')
      doc.setTextColor(...secondaryColor)
      doc.text(`Payment: ${paymentStatus.toUpperCase()}`, 14, startY)
      doc.text(`Status: ${orderStatus.toUpperCase()}`, 14, startY + 5)

      // Cancellation Reason
      const reason = source.cancellationReason || source.rejectionReason
      if (reason) {
        startY += 12
        doc.setTextColor(220, 38, 38)
        doc.setFont(undefined, 'bold')
        doc.text('Cancellation Reason:', 14, startY)
        doc.setFont(undefined, 'normal')
        doc.text(reason, 14, startY + 5)
      }

      // Footer Note
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(8)
      doc.text('Thank you for ordering with us!', 105, 285, { align: 'center' })

      window.open(doc.output('bloburl'), '_blank')
    } catch (error) {
      debugError("Error generating PDF invoice:", error)
      alert("Failed to generate PDF invoice. Please check if items data is available.")
    }
  }

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  const resetColumns = (defaultColumns) => {
    setVisibleColumns(defaultColumns || {})
  }

  return {
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isViewOrderOpen,
    setIsViewOrderOpen,
    selectedOrder,
    filters,
    setFilters,
    visibleColumns,
    filteredData,
    count,
    activeFiltersCount,
    handleApplyFilters,
    handleResetFilters,
    handleExport,
    handleViewOrder,
    handlePrintOrder,
    toggleColumn,
    resetColumns,
  }
}

