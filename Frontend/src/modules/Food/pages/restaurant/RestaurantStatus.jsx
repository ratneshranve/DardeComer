import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import { ArrowLeft, Settings, ChevronRight } from "lucide-react"
import { Switch } from "@food/components/ui/switch"
import { Card, CardContent } from "@food/components/ui/card"
import { restaurantAPI } from "@food/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog"
import { Button } from "@food/components/ui/button"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const RESTAURANT_ONLINE_STATUS_KEY = "restaurant_online_status"

const persistRestaurantOnlineStatus = (isOnline) => {
  try {
    localStorage.setItem(RESTAURANT_ONLINE_STATUS_KEY, JSON.stringify(Boolean(isOnline)))
  } catch (error) {
    debugError("Error persisting restaurant online status:", error)
  }
}

export default function RestaurantStatus() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [deliveryStatus, setDeliveryStatus] = useState(false)
  const [restaurantData, setRestaurantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [isWithinTimings, setIsWithinTimings] = useState(null)
  const [showOutletClosedDialog, setShowOutletClosedDialog] = useState(false)
  const [showOutsideTimingsDialog, setShowOutsideTimingsDialog] = useState(false)
  const [isDayClosed, setIsDayClosed] = useState(false)
  const [outletTimings, setOutletTimings] = useState(null)

  // Update current date/time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = response?.data?.data?.restaurant || response?.data?.restaurant
        if (data) setRestaurantData(data)
      } catch (error) {
        if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED') {
          debugError("Error fetching restaurant data:", error)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurantData()
  }, [])

  // Load outlet timings
  useEffect(() => {
    const loadOutletTimings = () => {
      restaurantAPI.getOutletTimings()
        .then((res) => {
          const data = res?.data?.data?.outletTimings || res?.data?.outletTimings
          if (data) setOutletTimings(data)
        })
        .catch((error) => debugError("Error loading outlet timings:", error))
    }
    loadOutletTimings()
    window.addEventListener("outletTimingsUpdated", loadOutletTimings)
    return () => window.removeEventListener("outletTimingsUpdated", loadOutletTimings)
  }, [])

  // Check if restaurant is open based on timings
  useEffect(() => {
    const checkIfOpen = () => {
      const now = new Date()
      const currentDayFull = now.toLocaleDateString('en-US', { weekday: 'long' })
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute

      if (!outletTimings || !outletTimings[currentDayFull]) {
        setIsDayClosed(false)
        setIsWithinTimings(true)
        return
      }

      const dayData = outletTimings[currentDayFull]
      if (dayData.isOpen === false) {
        setIsDayClosed(true)
        setIsWithinTimings(false)
        return
      }

      if (!dayData.openingTime || !dayData.closingTime) {
        setIsDayClosed(false)
        setIsWithinTimings(true)
        return
      }

      const [openHour, openMinute] = dayData.openingTime.split(':').map(Number)
      const [closeHour, closeMinute] = dayData.closingTime.split(':').map(Number)
      const openingTimeInMinutes = openHour * 60 + openMinute
      const closingTimeInMinutes = closeHour * 60 + closeMinute

      let isWithin = false
      if (closingTimeInMinutes > openingTimeInMinutes) {
        isWithin = currentTimeInMinutes >= openingTimeInMinutes && currentTimeInMinutes < closingTimeInMinutes
      } else {
        isWithin = currentTimeInMinutes >= openingTimeInMinutes || currentTimeInMinutes < closingTimeInMinutes
      }

      setIsDayClosed(false)
      setIsWithinTimings(isWithin)
    }

    checkIfOpen()
    const interval = setInterval(checkIfOpen, 60000)
    return () => clearInterval(interval)
  }, [currentDateTime, outletTimings])

  // Sync delivery status with backend and global events
  useEffect(() => {
    const loadDeliveryStatus = async () => {
      try {
        const response = await restaurantAPI.getCurrentRestaurant()
        const restaurant = response?.data?.data?.restaurant || response?.data?.restaurant
        if (restaurant?.isAcceptingOrders !== undefined) {
          setDeliveryStatus(restaurant.isAcceptingOrders)
          persistRestaurantOnlineStatus(restaurant.isAcceptingOrders)
        }
      } catch (error) {
        debugError("Error loading delivery status:", error)
      }
    }
    loadDeliveryStatus()

    const handleStatusChange = (event) => {
      if (event.detail?.isOnline !== undefined) {
        setDeliveryStatus(event.detail.isOnline)
      }
    }
    window.addEventListener('restaurantStatusChanged', handleStatusChange)
    return () => window.removeEventListener('restaurantStatusChanged', handleStatusChange)
  }, [])

  const handleDeliveryStatusChange = async (checked) => {
    if (checked && isDayClosed) {
      setShowOutletClosedDialog(true)
      return
    }
    if (checked && isWithinTimings === false && !isDayClosed) {
      setShowOutsideTimingsDialog(true)
      return
    }

    setDeliveryStatus(checked)
    try {
      await restaurantAPI.updateAcceptingOrders(checked)
      persistRestaurantOnlineStatus(checked)
      window.dispatchEvent(new CustomEvent('restaurantStatusChanged', { 
        detail: { isOnline: checked } 
      }))
    } catch (error) {
      debugError("Error saving delivery status:", error)
      setDeliveryStatus((prev) => !prev)
    }
  }

  const handleGoToOutletTimings = () => {
    setShowOutletClosedDialog(false)
    navigate("/restaurant/outlet-timings")
  }

  const formatTime12Hour = (time24) => {
    if (!time24) return ""
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'pm' : 'am'
    const hours12 = hours % 12 || 12
    const minutesStr = minutes.toString().padStart(2, '0')
    return `${hours12}:${minutesStr} ${period}`
  }

  const getCurrentDayTimings = () => {
    const now = new Date()
    const currentDayFull = now.toLocaleDateString('en-US', { weekday: 'long' })
    if (outletTimings && outletTimings[currentDayFull]) {
      const dayData = outletTimings[currentDayFull]
      if (dayData.isOpen && dayData.openingTime && dayData.closingTime) {
        return {
          openingTime: formatTime12Hour(dayData.openingTime),
          closingTime: formatTime12Hour(dayData.closingTime)
        }
      }
    }
    return null
  }

  const formatAddress = (location) => {
    if (!location) return ""
    const parts = []
    if (location.area) parts.push(location.area.trim())
    if (location.city) parts.push(location.city.trim())
    return parts.join(", ") || ""
  }

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Restaurant status</h1>
            <p className="text-sm text-gray-500 mt-0.5">You are mapped to 1 restaurant</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <Card className="bg-gray-50 border-none py-0 shadow-sm rounded-b-none rounded-t-lg">
          <CardContent className="p-4 gap-6 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  {loading ? "Loading..." : (restaurantData?.name || "Restaurant")}
                </h2>
                <p className="text-sm text-gray-500">
                  {loading ? "Loading..." : (
                    <>
                      {restaurantData?.id ? `ID: ${String(restaurantData.id).slice(-5)}` : ""}
                      {restaurantData?.location && formatAddress(restaurantData.location) ? (
                        <> | {formatAddress(restaurantData.location)}</>
                      ) : ""}
                    </>
                  )}
                </p>
              </div>
              <button onClick={() => navigate("/restaurant/explore")} className="ml-3 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors shrink-0">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900 mb-1.5">Delivery status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${deliveryStatus ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <p className="text-sm text-gray-500">
                    {deliveryStatus ? 'Receiving orders' : 'Not receiving orders'}
                  </p>
                </div>
              </div>
              <Switch
                checked={deliveryStatus}
                onCheckedChange={handleDeliveryStatusChange}
                className="ml-4 data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-green-600"
              />
            </div>

            <p className="text-sm text-gray-700 mb-2">Current delivery slot</p>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">
                {loading ? "Loading..." : (
                  (() => {
                    if (isDayClosed) return "Today is Off"
                    const timings = getCurrentDayTimings()
                    if (timings) {
                      const dateStr = currentDateTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                      return `${dateStr}, ${timings.openingTime} - ${timings.closingTime}`
                    }
                    return "Not configured"
                  })()
                )}
              </p>
              {!isDayClosed && (
                <button onClick={() => navigate("/restaurant/outlet-timings")} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Details <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {!isWithinTimings && restaurantData && !isDayClosed && (
          <div className="bg-pink-50 rounded-b-lg rounded-t-none p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-gray-700 flex-1">You are currently outside your scheduled delivery timings.</p>
          </div>
        )}

        <Dialog open={showOutletClosedDialog} onOpenChange={setShowOutletClosedDialog}>
          <DialogContent className="sm:max-w-md p-4 w-[90%] gap-2 flex flex-col">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <span className="text-3xl">??</span>
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 text-center">Outlet Timings Closed</DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button onClick={() => setShowOutletClosedDialog(false)} variant="outline" className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleGoToOutletTimings} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">Go to Outlet Timings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showOutsideTimingsDialog} onOpenChange={setShowOutsideTimingsDialog}>
          <DialogContent className="sm:max-w-md p-4 w-[90%] gap-2 flex flex-col">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <span className="text-3xl">??</span>
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 text-center">Outside Delivery Timings</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600">You are currently outside your scheduled delivery timings. Please change outlet timings to enable delivery status.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button onClick={() => setShowOutsideTimingsDialog(false)} variant="outline" className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={() => { setShowOutsideTimingsDialog(false); navigate("/restaurant/outlet-timings"); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">Change Outlet Timings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
