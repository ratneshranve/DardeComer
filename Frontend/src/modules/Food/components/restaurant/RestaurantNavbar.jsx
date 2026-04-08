import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Menu, ChevronRight, MapPin, X, Bell } from "lucide-react"
import { restaurantAPI } from "@food/api"
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings"
import useNotificationInbox from "@food/hooks/useNotificationInbox"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const extractRestaurantPayload = (response) =>
  response?.data?.data?.restaurant ||
  response?.data?.restaurant ||
  response?.data?.data?.user ||
  response?.data?.user ||
  response?.data?.data ||
  null


export default function RestaurantNavbar({
  restaurantName: propRestaurantName,
  location: propLocation,
  showSearch = true,
  showOfflineOnlineTag = true,
  showNotifications = true,
}) {
  const navigate = useNavigate()
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [status, setStatus] = useState("Offline")
  const [restaurantData, setRestaurantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState("")
  const [logoUrl, setLogoUrl] = useState(null)
  const { unreadCount } = useNotificationInbox("restaurant", { limit: 20, pollMs: 5 * 60 * 1000 })

  // Load business settings for branding
  useEffect(() => {
    const loadSettings = async () => {
      const cached = getCachedSettings()
      if (cached) {
        if (cached.companyName) setCompanyName(cached.companyName)
        const logo = cached.restaurantLogo?.url || cached.logo?.url
        if (logo) setLogoUrl(logo)
      } else {
        const settings = await loadBusinessSettings()
        if (settings) {
          if (settings.companyName) setCompanyName(settings.companyName)
          const logo = settings.restaurantLogo?.url || settings.logo?.url
          if (logo) setLogoUrl(logo)
        }
      }
    }
    loadSettings()

    const handleSettingsUpdate = () => {
      const cached = getCachedSettings()
      if (cached) {
        if (cached.companyName) setCompanyName(cached.companyName)
        const logo = cached.restaurantLogo?.url || cached.logo?.url
        if (logo) setLogoUrl(logo)
      }
    }
    window.addEventListener('businessSettingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('businessSettingsUpdated', handleSettingsUpdate)
  }, [])

  // Fetch restaurant data on mount
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = extractRestaurantPayload(response)
        if (data) {
          setRestaurantData(data)
        }
      } catch (error) {
        if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED' && !error.message?.includes('timeout')) {
          debugError("Error fetching restaurant data:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [])

  // Format full address from location object
  const formatAddress = (location) => {
    if (!location) return ""
    if (location.formattedAddress && location.formattedAddress.trim() !== "" && location.formattedAddress !== "Select location") {
      const isCoordinates = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(location.formattedAddress.trim())
      if (!isCoordinates) return location.formattedAddress.trim()
    }
    if (location.address && location.address.trim() !== "") return location.address.trim()
    const parts = []
    if (location.addressLine1) parts.push(location.addressLine1.trim())
    else if (location.street) parts.push(location.street.trim())
    if (location.addressLine2) parts.push(location.addressLine2.trim())
    if (location.area) parts.push(location.area.trim())
    if (location.landmark) parts.push(location.landmark.trim())
    if (location.city) {
      const city = location.city.trim()
      if (!parts.some(part => part.toLowerCase().includes(city.toLowerCase()))) parts.push(city)
    }
    if (location.state) {
      const state = location.state.trim()
      if (!parts.some(part => part.toLowerCase().includes(state.toLowerCase()))) parts.push(state)
    }
    if (location.zipCode || location.pincode || location.postalCode) {
      parts.push((location.zipCode || location.pincode || location.postalCode).trim())
    }
    return parts.length > 0 ? parts.join(", ") : ""
  }

  const restaurantName = propRestaurantName || restaurantData?.name || "Restaurant"
  const [location, setLocation] = useState("")

  useEffect(() => {
    let newLocation = ""
    if (propLocation && propLocation.trim() !== "") {
      newLocation = propLocation.trim()
    } else if (restaurantData) {
      if (restaurantData.location) {
        if (restaurantData.location.formattedAddress && 
            restaurantData.location.formattedAddress.trim() !== "" && 
            restaurantData.location.formattedAddress !== "Select location") {
          const isCoordinates = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(restaurantData.location.formattedAddress.trim())
          if (!isCoordinates) newLocation = restaurantData.location.formattedAddress.trim()
        }
        if (!newLocation) {
          const formatted = formatAddress(restaurantData.location)
          if (formatted && formatted.trim() !== "") newLocation = formatted.trim()
        }
        if (!newLocation && restaurantData.location.address && restaurantData.location.address.trim() !== "") {
          newLocation = restaurantData.location.address.trim()
        }
      }
      if (!newLocation && restaurantData.address && restaurantData.address.trim() !== "") {
        newLocation = restaurantData.address.trim()
      }
    }
    setLocation(newLocation)
  }, [restaurantData, propLocation])

  useEffect(() => {
    const updateStatus = () => {
      try {
        const savedStatus = localStorage.getItem('restaurant_online_status')
        if (savedStatus !== null) {
          const isOnline = JSON.parse(savedStatus)
          setStatus(isOnline ? "Online" : "Offline")
        } else {
          const isOnline = Boolean(restaurantData?.isAcceptingOrders)
          setStatus(isOnline ? "Online" : "Offline")
        }
      } catch (error) {
        debugError("Error loading restaurant status:", error)
        const isOnline = Boolean(restaurantData?.isAcceptingOrders)
        setStatus(isOnline ? "Online" : "Offline")
      }
    }
    updateStatus()
    const handleStatusChange = (event) => {
      const isOnline = event.detail?.isOnline || false
      setStatus(isOnline ? "Online" : "Offline")
    }
    window.addEventListener('restaurantStatusChanged', handleStatusChange)
    return () => window.removeEventListener('restaurantStatusChanged', handleStatusChange)
  }, [restaurantData])

  const handleStatusClick = () => navigate("/restaurant/status")
  const handleSearchClick = () => setIsSearchActive(true)
  const handleSearchClose = () => {
    setIsSearchActive(false)
    setSearchValue("")
  }
  const handleSearchChange = (e) => setSearchValue(e.target.value)
  const handleMenuClick = () => navigate("/restaurant/explore")
  const handleNotificationsClick = () => navigate("/restaurant/notifications")

  if (isSearchActive) {
    return (
      <div className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search by order ID"
            className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={handleSearchClose}
          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0"
          aria-label="Close search"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">
              {loading ? "Loading..." : (restaurantName || "Restaurant")}
            </h1>
            {companyName && !loading && (
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight shrink-0">
                {companyName}
              </span>
            )}
          </div>
          {!loading && location && location.trim() !== "" && (
            <div className="flex items-center gap-1 mt-0.5 opacity-80">
              <MapPin className="w-2.5 h-2.5 text-gray-500 shrink-0" />
              <p className="text-[10px] text-gray-500 truncate font-medium" title={location}>
                {location}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center">
        {showOfflineOnlineTag && (
          <button
            onClick={handleStatusClick}
            className={`flex items-center gap-1.5 px-2 py-1 border rounded-full hover:opacity-80 transition-all ${
              status === "Online" 
                ? "bg-green-50 border-green-300" 
                : "bg-gray-100 border-gray-300"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === "Online" ? "bg-green-500" : "bg-gray-500"
            }`}></span>
            <span className={`text-sm font-medium ${
              status === "Online" ? "text-green-700" : "text-gray-700"
            }`}>
              {status}
            </span>
            <ChevronRight className={`w-4 h-4 ${
              status === "Online" ? "text-green-700" : "text-gray-700"
            }`} />
          </button>
        )}

        {showSearch && (
          <button
            onClick={handleSearchClick}
            className="p-2 ml-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {showNotifications && (
            <button
              onClick={handleNotificationsClick}
              className="relative p-2 ml-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
              )}
            </button>
          )}

        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  )
}
