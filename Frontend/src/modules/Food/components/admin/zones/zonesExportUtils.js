// Export utility functions for zones
export const exportZonesToCSV = (zones, filename = "zones") => {
  const headers = ["SI", "Zone ID", "Name", "Display Name", "Restaurants", "Deliverymen", "Default Status", "Status"]
  const rows = zones.map((zone, index) => [
    index + 1,
    zone.zoneId,
    zone.name,
    zone.displayName,
    zone.restaurants,
    zone.deliverymen,
    zone.isDefault ? "Yes" : "No",
    zone.status ? "Active" : "Inactive"
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

export const exportZonesToExcel = (zones, filename = "zones") => {
  const headers = ["SI", "Zone ID", "Name", "Display Name", "Restaurants", "Deliverymen", "Default Status", "Status"]
  const rows = zones.map((zone, index) => [
    index + 1,
    zone.zoneId,
    zone.name,
    zone.displayName,
    zone.restaurants,
    zone.deliverymen,
    zone.isDefault ? "Yes" : "No",
    zone.status ? "Active" : "Inactive"
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

export const exportZonesToPDF = async (zones, filename = "zones") => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text("Zones List", 14, 15)
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
  
  const headers = ["SI", "Zone ID", "Name", "Display Name", "Restaurants", "Deliverymen", "Default Status", "Status"]
  const rows = zones.map((zone, index) => [
    index + 1,
    zone.zoneId,
    zone.name,
    zone.displayName,
    zone.restaurants,
    zone.deliverymen,
    zone.isDefault ? "Yes" : "No",
    zone.status ? "Active" : "Inactive"
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

export const exportZonesToJSON = (zones, filename = "zones") => {
  const jsonContent = JSON.stringify(zones, null, 2)
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

