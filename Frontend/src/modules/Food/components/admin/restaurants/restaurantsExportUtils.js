// Export utility functions for restaurants
export const exportRestaurantsToExcel = (restaurants, filename = "restaurants") => {
  const headers = [
    "SI",
    "Restaurant ID",
    "Restaurant Name",
    "Owner Name",
    "Owner Phone",
    "Zone",
    "Cuisine",
    "Status",
    "Rating"
  ]
  
  const rows = restaurants.map((restaurant, index) => [
    index + 1,
    restaurant.originalData?.restaurantId || restaurant.originalData?._id || restaurant._id || restaurant.id || "N/A",
    restaurant.name || "N/A",
    restaurant.ownerName || "N/A",
    restaurant.ownerPhone || "N/A",
    restaurant.zone || "N/A",
    restaurant.cuisine || "N/A",
    restaurant.status ? "Active" : "Inactive",
    restaurant.rating || 0
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

export const exportRestaurantsToPDF = async (restaurants, filename = "restaurants") => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  doc.setFontSize(16)
  doc.text("Restaurants List", 14, 15)
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
  
  const headers = [
    "SI",
    "Restaurant ID",
    "Restaurant Name",
    "Owner Name",
    "Owner Phone",
    "Zone",
    "Cuisine",
    "Status",
    "Rating"
  ]
  
  const rows = restaurants.map((restaurant, index) => [
    index + 1,
    restaurant.originalData?.restaurantId || restaurant.originalData?._id || restaurant._id || restaurant.id || "N/A",
    restaurant.name || "N/A",
    restaurant.ownerName || "N/A",
    restaurant.ownerPhone || "N/A",
    restaurant.zone || "N/A",
    restaurant.cuisine || "N/A",
    restaurant.status ? "Active" : "Inactive",
    restaurant.rating || 0
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

